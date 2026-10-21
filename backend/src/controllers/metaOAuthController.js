// backend/src/controllers/metaOAuthController.js
// Handles official Meta OAuth 2.0 flow, Page selection, token management, manual sync, and disconnection.

const mongoose = require('mongoose');
const MetaIntegration = require('../models/MetaIntegration');
const Tenant = require('../models/Tenant');
const Lead = require('../models/Lead');
const { verifyOAuthState, decryptToken, encryptToken } = require('../utils/cryptoUtils');
const { getMetaRedirectUri } = require('../utils/appUrl');
const {
  getOAuthDialogUrl,
  exchangeCodeForTokens,
  fetchUserProfile,
  fetchUserPagesWithForms,
  subscribePageToWebhooks,
  unsubscribePageFromWebhooks,
  syncFormLeads,
} = require('../services/metaLeadService');

// @desc    Initiate official Meta OAuth authorization flow
// @route   GET /api/meta/oauth/url
// @access  Protected (Merchant Owner / Admin)
const initiateOAuth = async (req, res) => {
  try {
    const businessId = req.businessId;
    if (!businessId) {
      return res.status(403).json({ success: false, message: 'Tenant context required' });
    }

    const oauthUrl = getOAuthDialogUrl(businessId);
    res.json({
      success: true,
      oauthUrl,
    });
  } catch (error) {
    console.error('[metaOAuthController] Initiate OAuth error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to initiate Meta OAuth authorization flow',
    });
  }
};

// @desc    Handle Meta OAuth Redirect Callback
// @route   GET /api/meta/oauth/callback
// @access  Public (Redirect target from Meta OAuth Dialog)
const handleOAuthCallback = async (req, res) => {
  const clientUrl = String(process.env.CLIENT_URL || process.env.APP_URL || '').trim().replace(/\/+$/, '');
  if (!clientUrl) {
    return res.status(503).send('CLIENT_URL is not configured. Meta OAuth cannot redirect back to the dashboard.');
  }
  try {
    getMetaRedirectUri();
  } catch (configError) {
    return res.status(503).send(configError.message);
  }
  const { code, state, error, error_reason, error_description } = req.query;

  // Handle user denied or Meta authorization error
  if (error || error_reason) {
    console.warn('[metaOAuthController] Meta authorization denied or failed:', error_description || error);
    const redirectTarget = `${clientUrl}/merchant/integrations?metaError=${encodeURIComponent(
      error_description || 'Authorization was cancelled or denied by user.'
    )}`;
    return res.redirect(redirectTarget);
  }

  if (!code || !state) {
    return res.redirect(`${clientUrl}/merchant/integrations?metaError=${encodeURIComponent('Missing OAuth code or state parameter')}`);
  }

  // 1. Verify anti-CSRF state token
  const businessId = verifyOAuthState(state);
  if (!businessId) {
    console.warn('[metaOAuthController] Invalid or expired OAuth state');
    return res.redirect(`${clientUrl}/merchant/integrations?metaError=${encodeURIComponent('Invalid or expired OAuth state token. Please try connecting again.')}`);
  }

  try {
    // 2. Exchange authorization code for long-lived User Access Token
    const { userAccessToken, userTokenExpiresAt } = await exchangeCodeForTokens(code);

    // 3. Fetch User Profile & Managed Pages
    const profile = await fetchUserProfile(userAccessToken);
    const pages = await fetchUserPagesWithForms(userAccessToken);

    // 4. Automatically subscribe pages to app's leadgen webhooks
    for (const page of pages) {
      try {
        const plainPageToken = decryptToken(page.encryptedPageAccessToken);
        const subResult = await subscribePageToWebhooks(page.pageId, plainPageToken);
        if (subResult.success) {
          page.isSubscribed = true;
          page.subscribedAt = new Date();
        }
      } catch (subErr) {
        console.warn(`[metaOAuthController] Warning: Could not subscribe page ${page.pageId} immediately:`, subErr.message);
      }
    }

    // 5. Upsert integration record in MongoDB
    let integration = await MetaIntegration.findOne({ businessId });
    if (!integration) {
      integration = new MetaIntegration({ businessId });
    }

    integration.status = 'CONNECTED';
    integration.metaUserId = profile.id || '';
    integration.metaUserName = profile.name || '';
    integration.encryptedUserAccessToken = encryptToken(userAccessToken);
    integration.userTokenExpiresAt = userTokenExpiresAt;
    integration.pages = pages;
    integration.lastSyncStatus = 'CONNECTED';
    integration.lastSyncError = '';

    integration.syncLogs.unshift({
      timestamp: new Date(),
      type: 'OAUTH_CONNECT',
      status: 'SUCCESS',
      message: `Meta Account "${profile.name}" connected. ${pages.length} Facebook Page(s) authorized with leadgen webhook subscription.`,
    });

    if (integration.syncLogs.length > 50) {
      integration.syncLogs = integration.syncLogs.slice(0, 50);
    }

    await integration.save();

    console.log(`[metaOAuthController] Meta integration successfully established for tenant ${businessId}`);
    return res.redirect(`${clientUrl}/merchant/integrations?metaConnected=true&pagesCount=${pages.length}`);
  } catch (err) {
    console.error('[metaOAuthController] OAuth callback execution failed:', err);
    return res.redirect(
      `${clientUrl}/merchant/integrations?metaError=${encodeURIComponent(err.message || 'Failed to complete Meta token exchange.')}`
    );
  }
};

// @desc    Get Meta integration status and connected Pages for authenticated tenant
// @route   GET /api/meta/integration
// @access  Protected (Merchant Owner / Admin)
const getIntegrationStatus = async (req, res) => {
  try {
    const businessId = req.businessId;

    const host = req.get('host');
    if (!host) {
      return res.status(503).json({
        success: false,
        message: 'Unable to determine the public webhook host for this request',
      });
    }
    const protocol = req.protocol || 'https';
    const tenant = await Tenant.findById(businessId);
    if (!tenant || !tenant.slug) {
      return res.status(409).json({
        success: false,
        message: 'This workspace has no storefront slug. Configure a slug before connecting Meta.',
      });
    }
    const tenantSlug = tenant.slug;
    const webhookUrl = `${protocol}://${host}/api/webhooks/meta?tenantSlug=${encodeURIComponent(tenantSlug)}`;
    // The platform owns the Meta app and its webhook verify token. Never send
    // that server secret to a merchant browser.
    const webhookInfo = { webhookUrl };

    const integration = await MetaIntegration.findOne({ businessId });

    if (!integration || integration.status === 'DISCONNECTED') {
      return res.json({
        success: true,
        connected: false,
        status: 'DISCONNECTED',
        metaUserName: '',
        metaUserId: '',
        pages: [],
        totalLeadsImported: 0,
        lastSyncAt: null,
        syncLogs: [],
        webhookInfo,
      });
    }

    // Sanitize pages list for frontend (NEVER expose tokens)
    const sanitizedPages = integration.pages.map((p) => ({
      pageId: p.pageId,
      pageName: p.pageName,
      category: p.category,
      pictureUrl: p.pictureUrl,
      isSubscribed: Boolean(p.isSubscribed),
      isSelected: Boolean(p.isSelected),
      subscribedAt: p.subscribedAt,
      leadForms: (p.leadForms || []).map((f) => ({
        formId: f.formId,
        formName: f.formName,
        status: f.status,
        isSelected: Boolean(f.isSelected),
        leadCount: f.leadCount || 0,
        lastSyncedAt: f.lastSyncedAt,
      })),
    }));

    // Check token expiration
    let isExpired = false;
    if (integration.userTokenExpiresAt && new Date() > new Date(integration.userTokenExpiresAt)) {
      isExpired = true;
      if (integration.status !== 'EXPIRED') {
        integration.status = 'EXPIRED';
        await integration.save();
      }
    }

    // Count total Meta leads in DB for this tenant
    const dbMetaLeadCount = await Lead.countDocuments({ businessId, source: 'META_ADS' });

    res.json({
      success: true,
      connected: integration.status === 'CONNECTED' && !isExpired,
      status: isExpired ? 'EXPIRED' : integration.status,
      metaUserName: integration.metaUserName,
      metaUserId: integration.metaUserId,
      pages: sanitizedPages,
      totalLeadsImported: Math.max(integration.totalLeadsImported || 0, dbMetaLeadCount),
      lastSyncAt: integration.lastSyncAt,
      lastSyncStatus: integration.lastSyncStatus,
      lastSyncError: integration.lastSyncError,
      syncLogs: (integration.syncLogs || []).slice(0, 15),
      webhookInfo,
    });
  } catch (error) {
    console.error('[metaOAuthController] getIntegrationStatus error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle selection for Pages and/or specific lead forms
// @route   PATCH /api/meta/integration/pages
// @access  Protected (Merchant Owner / Admin)
const updatePageSelection = async (req, res) => {
  try {
    const businessId = req.businessId;
    const { pageId, formId, isSelected } = req.body;

    const integration = await MetaIntegration.findOne({ businessId });
    if (!integration || integration.status !== 'CONNECTED') {
      return res.status(404).json({ success: false, message: 'Active Meta integration not found' });
    }

    const targetPage = integration.pages.find((p) => p.pageId === pageId);
    if (!targetPage) {
      return res.status(404).json({ success: false, message: 'Target Facebook Page not found in integration' });
    }

    if (formId) {
      // Toggle specific form selection
      const targetForm = targetPage.leadForms.find((f) => f.formId === formId);
      if (targetForm) {
        targetForm.isSelected = Boolean(isSelected);
      }
    } else {
      // Toggle whole page selection
      targetPage.isSelected = Boolean(isSelected);

      // Subscribe or unsubscribe page based on selection
      try {
        const plainPageToken = decryptToken(targetPage.encryptedPageAccessToken);
        if (targetPage.isSelected) {
          const subRes = await subscribePageToWebhooks(targetPage.pageId, plainPageToken);
          if (subRes.success) {
            targetPage.isSubscribed = true;
            targetPage.subscribedAt = new Date();
          }
        } else {
          await unsubscribePageFromWebhooks(targetPage.pageId, plainPageToken);
          targetPage.isSubscribed = false;
        }
      } catch (subErr) {
        console.warn(`[metaOAuthController] Could not update page webhook subscription:`, subErr.message);
      }
    }

    await integration.save();

    res.json({
      success: true,
      message: 'Page and form preferences updated successfully',
    });
  } catch (error) {
    console.error('[metaOAuthController] updatePageSelection error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Trigger manual sync / reconciliation across all selected lead forms
// @route   POST /api/meta/integration/sync
// @access  Protected (Merchant Owner / Admin)
const manualSync = async (req, res) => {
  try {
    const businessId = req.businessId;

    const integration = await MetaIntegration.findOne({ businessId });
    if (!integration || integration.status !== 'CONNECTED') {
      return res.status(400).json({
        success: false,
        message: 'No active Meta integration to sync. Please connect your Meta account first.',
      });
    }

    let totalImportedThisBatch = 0;
    const selectedPages = integration.pages.filter((p) => p.isSelected !== false);

    if (selectedPages.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No Facebook Pages are currently selected for lead synchronization.',
      });
    }

    for (const page of selectedPages) {
      let plainPageToken = '';
      try {
        plainPageToken = decryptToken(page.encryptedPageAccessToken);
      } catch (decryptErr) {
        console.error(`[manualSync] Token decryption failed for page ${page.pageId}:`, decryptErr.message);
        continue;
      }

      const activeForms = (page.leadForms || []).filter((f) => f.isSelected !== false);

      for (const form of activeForms) {
        try {
          const count = await syncFormLeads(
            businessId,
            page.pageId,
            page.pageName,
            form.formId,
            form.formName,
            plainPageToken,
            50
          );
          totalImportedThisBatch += count;
          form.lastSyncedAt = new Date();
        } catch (formSyncErr) {
          console.warn(`[manualSync] Error syncing form ${form.formId}:`, formSyncErr.message);
        }
      }
    }

    integration.totalLeadsImported = (integration.totalLeadsImported || 0) + totalImportedThisBatch;
    integration.lastSyncAt = new Date();
    integration.lastSyncStatus = 'SUCCESS';
    integration.lastSyncError = '';

    integration.syncLogs.unshift({
      timestamp: new Date(),
      type: 'MANUAL_SYNC',
      status: 'SUCCESS',
      message: `Manual sync completed. Ingested ${totalImportedThisBatch} new lead(s) across selected forms.`,
      importedCount: totalImportedThisBatch,
    });

    if (integration.syncLogs.length > 50) {
      integration.syncLogs = integration.syncLogs.slice(0, 50);
    }

    await integration.save();

    const totalLeads = await Lead.countDocuments({ businessId, source: 'META_ADS' });

    res.json({
      success: true,
      message: `Sync complete! Ingested ${totalImportedThisBatch} new lead(s).`,
      importedCount: totalImportedThisBatch,
      totalLeads,
      lastSyncAt: integration.lastSyncAt,
    });
  } catch (error) {
    console.error('[metaOAuthController] manualSync error:', error.message);

    if (req.businessId) {
      await MetaIntegration.updateOne(
        { businessId: req.businessId },
        {
          $set: { lastSyncStatus: 'FAILURE', lastSyncError: error.message },
          $push: {
            syncLogs: {
              $each: [
                {
                  timestamp: new Date(),
                  type: 'MANUAL_SYNC',
                  status: 'FAILURE',
                  message: `Sync failed: ${error.message}`,
                  error: error.message,
                },
              ],
              $slice: 50,
            },
          },
        }
      ).catch(() => {});
    }

    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Disconnect Meta account, unsubscribe Pages, and purge tokens
// @route   POST /api/meta/integration/disconnect
// @access  Protected (Merchant Owner / Admin)
const disconnectIntegration = async (req, res) => {
  try {
    const businessId = req.businessId;

    const integration = await MetaIntegration.findOne({ businessId });
    if (!integration) {
      return res.json({ success: true, message: 'Already disconnected' });
    }

    // Attempt to unsubscribe all Pages from webhook notifications
    for (const page of integration.pages) {
      try {
        const plainPageToken = decryptToken(page.encryptedPageAccessToken);
        await unsubscribePageFromWebhooks(page.pageId, plainPageToken);
      } catch (unsubErr) {
        console.warn(`[disconnectIntegration] Could not unsubscribe page ${page.pageId}:`, unsubErr.message);
      }
    }

    integration.status = 'DISCONNECTED';
    integration.encryptedUserAccessToken = '';
    integration.pages = [];
    integration.lastSyncStatus = 'DISCONNECTED';

    integration.syncLogs.unshift({
      timestamp: new Date(),
      type: 'DISCONNECT',
      status: 'SUCCESS',
      message: 'Meta account disconnected and Facebook Page webhook subscriptions removed.',
    });

    if (integration.syncLogs.length > 50) {
      integration.syncLogs = integration.syncLogs.slice(0, 50);
    }

    await integration.save();

    res.json({
      success: true,
      message: 'Meta account disconnected successfully',
    });
  } catch (error) {
    console.error('[metaOAuthController] disconnectIntegration error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  initiateOAuth,
  handleOAuthCallback,
  getIntegrationStatus,
  updatePageSelection,
  manualSync,
  disconnectIntegration,
};
