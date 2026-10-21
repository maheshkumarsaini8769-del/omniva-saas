// backend/src/services/metaLeadService.js
// Core service for Meta Graph API OAuth, Page Webhook subscriptions, lead fetching, and ingestion.

const mongoose = require('mongoose');
const Lead = require('../models/Lead');
const MetaIntegration = require('../models/MetaIntegration');
const { generateOAuthState, encryptToken, decryptToken } = require('../utils/cryptoUtils');
const { triggerAutomation } = require('./automationEngine');
const { getMetaRedirectUri } = require('../utils/appUrl');

const GRAPH_VERSION = process.env.META_GRAPH_API_VERSION || 'v19.0';
const GRAPH_BASE_URL =
  process.env.META_GRAPH_BASE_URL || `https://graph.facebook.com/${GRAPH_VERSION}`;

const REQUIRED_SCOPES = [
  'pages_show_list',
  'pages_read_engagement',
  'pages_manage_ads',
  'pages_manage_metadata',
  'leads_retrieval',
];

/**
 * Generate official Meta OAuth dialog URL with anti-CSRF state.
 */
const getOAuthDialogUrl = (businessId) => {
  const appId = process.env.META_APP_ID;
  const redirectUri = getMetaRedirectUri();

  if (!appId) {
    throw new Error('META_APP_ID is not configured in server environment');
  }

  const state = generateOAuthState(businessId);
  const scope = REQUIRED_SCOPES.join(',');

  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    state,
    scope,
    response_type: 'code',
  });

  return `https://www.facebook.com/${GRAPH_VERSION}/dialog/oauth?${params.toString()}`;
};

/**
 * Exchange OAuth authorization code for long-lived User Access Token.
 */
const exchangeCodeForTokens = async (code) => {
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  const redirectUri = getMetaRedirectUri();

  if (!appId || !appSecret) {
    throw new Error('Meta App ID and Secret must be configured to complete OAuth exchange');
  }

  // 1. Get short-lived user access token
  const tokenUrl = `${GRAPH_BASE_URL}/oauth/access_token?${new URLSearchParams({
    client_id: appId,
    client_secret: appSecret,
    redirect_uri: redirectUri,
    code,
  }).toString()}`;

  const tokenRes = await fetch(tokenUrl);
  const tokenData = await tokenRes.json();

  if (tokenData.error) {
    throw new Error(`Meta Token Exchange Error: ${tokenData.error.message || JSON.stringify(tokenData.error)}`);
  }

  const shortLivedToken = tokenData.access_token;

  // 2. Exchange for long-lived user access token (60-day expiry)
  const longLivedUrl = `${GRAPH_BASE_URL}/oauth/access_token?${new URLSearchParams({
    grant_type: 'fb_exchange_token',
    client_id: appId,
    client_secret: appSecret,
    fb_exchange_token: shortLivedToken,
  }).toString()}`;

  const longLivedRes = await fetch(longLivedUrl);
  const longLivedData = await longLivedRes.json();

  const userAccessToken = longLivedData.access_token || shortLivedToken;
  const expiresIn = longLivedData.expires_in || tokenData.expires_in || (60 * 24 * 3600);

  return {
    userAccessToken,
    expiresIn,
    userTokenExpiresAt: new Date(Date.now() + expiresIn * 1000),
  };
};

/**
 * Fetch authenticated user profile (ID & Name).
 */
const fetchUserProfile = async (userAccessToken) => {
  const res = await fetch(`${GRAPH_BASE_URL}/me?fields=id,name&access_token=${encodeURIComponent(userAccessToken)}`);
  const data = await res.json();
  if (data.error) {
    throw new Error(`Failed to fetch Meta profile: ${data.error.message}`);
  }
  return data;
};

/**
 * Fetch all Facebook Pages managed by user, along with page access tokens & lead forms.
 */
const fetchUserPagesWithForms = async (userAccessToken) => {
  const pagesUrl = `${GRAPH_BASE_URL}/me/accounts?fields=id,name,category,access_token,picture&limit=50&access_token=${encodeURIComponent(userAccessToken)}`;
  const res = await fetch(pagesUrl);
  const data = await res.json();

  if (data.error) {
    throw new Error(`Failed to fetch Facebook Pages: ${data.error.message}`);
  }

  const rawPages = data.data || [];
  const processedPages = [];

  for (const p of rawPages) {
    const pageId = p.id;
    const pageName = p.name;
    const category = p.category || '';
    const pageAccessToken = p.access_token;
    const pictureUrl = p.picture?.data?.url || '';

    // Fetch lead forms for this Page
    let leadForms = [];
    try {
      const formsUrl = `${GRAPH_BASE_URL}/${pageId}/leadgen_forms?fields=id,name,status,leads_count&limit=100&access_token=${encodeURIComponent(pageAccessToken)}`;
      const formsRes = await fetch(formsUrl);
      const formsData = await formsRes.json();
      if (formsData.data) {
        leadForms = formsData.data.map((f) => ({
          formId: f.id,
          formName: f.name || '',
          status: f.status || 'UNKNOWN',
          isSelected: true,
          leadCount: f.leads_count || 0,
          lastSyncedAt: null,
        }));
      }
    } catch (formErr) {
      console.warn(`[metaLeadService] Could not fetch lead forms for page ${pageId}:`, formErr.message);
    }

    processedPages.push({
      pageId,
      pageName,
      category,
      pictureUrl,
      encryptedPageAccessToken: encryptToken(pageAccessToken),
      isSubscribed: false,
      isSelected: true,
      leadForms,
    });
  }

  return processedPages;
};

/**
 * Subscribe a Facebook Page to the app's Webhooks for 'leadgen' events.
 */
const subscribePageToWebhooks = async (pageId, plainPageAccessToken) => {
  try {
    const subUrl = `${GRAPH_BASE_URL}/${pageId}/subscribed_apps`;
    const res = await fetch(subUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscribed_fields: ['leadgen'],
        access_token: plainPageAccessToken,
      }),
    });
    const data = await res.json();
    return { success: !!data.success, data };
  } catch (err) {
    console.error(`[metaLeadService] Failed to subscribe page ${pageId}:`, err.message);
    return { success: false, error: err.message };
  }
};

/**
 * Unsubscribe a Facebook Page from the app's Webhooks.
 */
const unsubscribePageFromWebhooks = async (pageId, plainPageAccessToken) => {
  try {
    const unsubUrl = `${GRAPH_BASE_URL}/${pageId}/subscribed_apps?access_token=${encodeURIComponent(plainPageAccessToken)}`;
    const res = await fetch(unsubUrl, { method: 'DELETE' });
    const data = await res.json();
    return { success: !!data.success, data };
  } catch (err) {
    console.warn(`[metaLeadService] Failed to unsubscribe page ${pageId}:`, err.message);
    return { success: false, error: err.message };
  }
};

/**
 * Fetch full Lead details from Meta Graph API using leadgen_id and page access token.
 */
const fetchLeadDetails = async (leadgenId, plainPageAccessToken) => {
  const fields = [
    'id',
    'created_time',
    'ad_id',
    'ad_name',
    'adset_id',
    'adset_name',
    'campaign_id',
    'campaign_name',
    'form_id',
    'form_name',
    'field_data',
    'platform',
  ].join(',');

  const leadUrl = `${GRAPH_BASE_URL}/${leadgenId}?fields=${fields}&access_token=${encodeURIComponent(plainPageAccessToken)}`;
  const res = await fetch(leadUrl);
  const data = await res.json();

  if (data.error) {
    throw new Error(`Graph API error fetching lead ${leadgenId}: ${data.error.message}`);
  }

  return data;
};

/**
 * Parse Meta field_data array into standard CRM lead fields & question answers.
 */
const parseLeadFields = (leadRawData) => {
  const fieldData = leadRawData.field_data || [];
  let name = '';
  let firstName = '';
  let lastName = '';
  let phone = '';
  let email = '';
  const formAnswers = [];
  const customMap = {};

  for (const item of fieldData) {
    const key = (item.name || '').toLowerCase();
    const val = Array.isArray(item.values) ? item.values[0] : (item.values || '');
    const cleanVal = String(val || '').trim();

    if (!cleanVal) continue;

    if (key === 'full_name' || key === 'name') {
      name = cleanVal;
    } else if (key === 'first_name') {
      firstName = cleanVal;
    } else if (key === 'last_name') {
      lastName = cleanVal;
    } else if (key === 'phone_number' || key === 'phone' || key === 'contact_number') {
      phone = cleanVal;
    } else if (key === 'email' || key === 'email_address') {
      email = cleanVal.toLowerCase();
    } else {
      // Custom questions from the lead form
      formAnswers.push({
        fieldKey: item.name,
        question: item.name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        answer: cleanVal,
      });
      customMap[item.name] = cleanVal;
    }
  }

  if (!name && (firstName || lastName)) {
    name = `${firstName} ${lastName}`.trim();
  }

  if (!name) {
    name = 'Unnamed lead';
  }

  // Never invent a phone number. A lead without a phone or email is not
  // actionable and is rejected by the webhook handler.
  return {
    name,
    phone,
    email,
    formAnswers,
    customMap,
    campaignName: leadRawData.campaign_name || '',
    adSetName: leadRawData.adset_name || '',
    adName: leadRawData.ad_name || '',
    platform: leadRawData.platform || '',
    metaLeadId: leadRawData.id,
    metaFormId: leadRawData.form_id || '',
    metaFormName: leadRawData.form_name || '',
    metaAdId: leadRawData.ad_id || '',
    createdTime: leadRawData.created_time ? new Date(leadRawData.created_time) : new Date(),
  };
};

/**
 * Ingest a single Meta Lead into MongoDB, ensuring deduplication & triggering automations.
 */
const ingestLeadRecord = async (businessId, parsedData, pageContext = {}) => {
  if (mongoose.connection.readyState !== 1) {
    throw new Error('Cannot ingest Meta lead while the database is unavailable');
  }

  // 1. Deduplicate by unique Meta Lead ID
  let existing = null;
  if (parsedData.metaLeadId) {
    existing = await Lead.findOne({
      businessId,
      metaLeadId: parsedData.metaLeadId,
    });
  }

  const cleanPhone = String(parsedData.phone || '').replace(/[^0-9]/g, '').slice(-10);
  const cleanEmail = String(parsedData.email || '').trim().toLowerCase();

  // Fallback deduplication: same normalized phone within the last 24 hours.
  if (!existing && cleanPhone) {
    const oneDayAgo = new Date(Date.now() - 24 * 3600 * 1000);
    existing = await Lead.findOne({
      businessId,
      phone: cleanPhone,
      createdAt: { $gte: oneDayAgo },
    });
  }

  if (existing) {
    return { success: true, isNew: false, leadId: existing._id, existing: true };
  }

  const newLead = await Lead.create({
    businessId,
    name: parsedData.name,
    phone: cleanPhone,
    email: cleanEmail,
    source: 'META_ADS',
    metaLeadId: parsedData.metaLeadId,
    metaPageId: pageContext.pageId || '',
    metaPageName: pageContext.pageName || '',
    metaFormId: parsedData.metaFormId,
    metaFormName: parsedData.metaFormName,
    metaAdId: parsedData.metaAdId,
    platform: parsedData.platform || '',
    campaignName: parsedData.campaignName || '',
    adSetName: parsedData.adSetName || '',
    adName: parsedData.adName || '',
    formAnswers: parsedData.formAnswers || [],
    customFields: parsedData.customMap || {},
    status: 'NEW',
    notes: [
      {
        note: [
          '[Meta Lead Ingested]',
          parsedData.metaFormName || parsedData.metaFormId
            ? `Form: "${parsedData.metaFormName || parsedData.metaFormId}"`
            : '',
          parsedData.campaignName ? `Campaign: "${parsedData.campaignName}"` : '',
          `Platform: ${parsedData.platform?.toUpperCase() || 'Unknown'}`,
        ].filter(Boolean).join(' · '),
        authorName: 'Meta Lead Ads Sync',
        createdAt: new Date(),
      },
    ],
  });

  // Trigger automation asynchronously
  try {
    triggerAutomation({
      businessId,
      trigger: 'LEAD_INGESTED',
      entityType: 'LEAD',
      entityId: newLead._id.toString(),
      data: {
        customerName: newLead.name,
        customerPhone: newLead.phone,
        source: 'META_ADS',
        campaignName: newLead.campaignName,
        platform: newLead.platform,
        formAnswers: newLead.formAnswers,
      },
    }).catch((e) => console.warn('[metaLeadService] Automation warning:', e.message));
  } catch (autoErr) {
    console.warn('[metaLeadService] Automation error:', autoErr.message);
  }

  return { success: true, isNew: true, lead: newLead };
};

/**
 * Fetch and import historical leads from a specific lead form (with pagination).
 */
const syncFormLeads = async (businessId, pageId, pageName, formId, formName, plainPageAccessToken, maxLeads = 100) => {
  let importedCount = 0;
  let nextUrl = `${GRAPH_BASE_URL}/${formId}/leads?fields=id,created_time,ad_id,ad_name,adset_id,adset_name,campaign_id,campaign_name,form_id,form_name,field_data,platform&limit=50&access_token=${encodeURIComponent(plainPageAccessToken)}`;

  while (nextUrl && importedCount < maxLeads) {
    const res = await fetch(nextUrl);
    const data = await res.json();

    if (data.error) {
      throw new Error(`Failed to fetch leads for form ${formId}: ${data.error.message}`);
    }

    const leads = data.data || [];
    if (leads.length === 0) break;

    for (const rawLead of leads) {
      const parsed = parseLeadFields(rawLead);
      const result = await ingestLeadRecord(businessId, parsed, { pageId, pageName });
      if (result.isNew) {
        importedCount++;
      }
    }

    nextUrl = data.paging?.next || null;
  }

  return importedCount;
};

module.exports = {
  GRAPH_VERSION,
  GRAPH_BASE_URL,
  getOAuthDialogUrl,
  exchangeCodeForTokens,
  fetchUserProfile,
  fetchUserPagesWithForms,
  subscribePageToWebhooks,
  unsubscribePageFromWebhooks,
  fetchLeadDetails,
  parseLeadFields,
  ingestLeadRecord,
  syncFormLeads,
};
