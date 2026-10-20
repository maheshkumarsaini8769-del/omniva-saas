// backend/src/controllers/metaWebhookController.js
// Handles inbound Meta Lead Ads Webhook notifications, signature verification,
// tenant resolution, Graph API lead retrieval, and CRM ingestion.

const mongoose = require('mongoose');
const Tenant = require('../models/Tenant');
const Lead = require('../models/Lead');
const MetaIntegration = require('../models/MetaIntegration');
const { verifyMetaWebhookSignature, decryptToken } = require('../utils/cryptoUtils');
const { fetchLeadDetails, parseLeadFields, ingestLeadRecord } = require('../services/metaLeadService');
const { triggerAutomation } = require('../services/automationEngine');

// @desc    Verify Meta Webhook subscription
// @route   GET /api/webhooks/meta
// @access  Public (Meta Verification Handshake)
const verifyWebhook = (req, res) => {
  const mode = req.query['hub.mode'] || (req.query.hub && req.query.hub.mode) || req.query.mode;
  const token = req.query['hub.verify_token'] || (req.query.hub && req.query.hub.verify_token) || req.query.verify_token;
  const challenge = req.query['hub.challenge'] || (req.query.hub && req.query.hub.challenge) || req.query.challenge;

  const expectedToken = process.env.META_WEBHOOK_VERIFY_TOKEN;
  if (!expectedToken) {
    console.error('[Meta Webhook] META_WEBHOOK_VERIFY_TOKEN is not configured');
    return res.status(503).json({ success: false, message: 'Webhook verify token not configured' });
  }

  if (mode === 'subscribe' && token === expectedToken) {
    console.log('[Meta Webhook] Verification handshake successful');
    return res.status(200).send(challenge);
  }

  console.warn('[Meta Webhook] Verification token mismatch. Received:', token);
  return res.status(403).json({ success: false, message: 'Verification token mismatch' });
};

// @desc    Handle inbound Meta Lead Ads Webhook notification
// @route   POST /api/webhooks/meta
// @access  Public (Meta Webhook Ingestion)
const handleMetaWebhook = async (req, res) => {
  try {
    // 1. Signature Verification
    const signature = req.headers['x-hub-signature-256'];
    const appSecret = process.env.META_APP_SECRET;

    if (appSecret) {
      // When a secret is configured, the signature is mandatory.
      if (!signature || !req.rawBody) {
        console.warn('[Meta Webhook] Missing signature header; request rejected.');
        return res.status(403).json({ success: false, message: 'Missing X-Hub-Signature-256' });
      }
      const isValid = verifyMetaWebhookSignature(req.rawBody, signature, appSecret);
      if (!isValid) {
        console.warn('[Meta Webhook] Signature verification failed! Request rejected.');
        return res.status(403).json({ success: false, message: 'Invalid X-Hub-Signature-256' });
      }
    } else if (process.env.NODE_ENV === 'production') {
      console.error('[Meta Webhook] META_APP_SECRET is not configured. Rejecting webhook.');
      return res.status(503).json({ success: false, message: 'Webhook secret not configured' });
    }

    const { entry } = req.body || {};
    const tenantSlug = req.query.tenantSlug || req.query.slug || '';

    if (!entry || !Array.isArray(entry)) {
      return res.status(200).json({ success: true, message: 'EVENT_RECEIVED' });
    }

    // Process lead events before acknowledging. If ingestion fails, return a
    // non-2xx status so Meta retries instead of silently losing the lead.
    const processing = [];
    for (const item of entry) {
      const pageId = String(item.id || '');
      const changes = item.changes || [];

      for (const change of changes) {
        if (change.field === 'messages') {
          console.log('[WhatsApp Webhook Event]:', change.value);
        } else if (change.field === 'leadgen') {
          const value = change.value || {};
          const leadgenId = value.leadgen_id;
          const formId = value.form_id;
          const adId = value.ad_id;

          if (!leadgenId) {
            console.warn('[Meta Webhook] leadgen event missing leadgen_id');
            continue;
          }

          processing.push(
            processLeadgenEvent(pageId, leadgenId, formId, adId, value, tenantSlug)
          );
        }
      }
    }

    const results = await Promise.allSettled(processing);
    const failures = results.filter((result) => result.status === 'rejected');
    if (failures.length > 0) {
      failures.forEach((failure) =>
        console.error('[Meta Webhook] Lead ingestion failed:', failure.reason?.message || failure.reason)
      );
      return res.status(500).json({
        success: false,
        message: 'One or more lead events could not be ingested; retry requested',
      });
    }

    return res.status(200).json({ success: true, message: 'EVENT_RECEIVED' });
  } catch (error) {
    console.error('[Meta Webhook Handler Error]', error);
    if (!res.headersSent) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }
};

/**
 * Asynchronously retrieve full lead details from Meta Graph API and ingest into tenant CRM.
 */
const processLeadgenEvent = async (pageId, leadgenId, formId, adId, payloadValue = {}, tenantSlug = '') => {
  try {
    // 1. Resolve owning tenant from MetaIntegration by pageId
    let integration = await MetaIntegration.findOne({
      'pages.pageId': pageId,
      status: 'CONNECTED',
    });

    let plainPageToken = '';
    let targetPageName = 'Facebook Page';

    if (integration) {
      const pageObj = integration.pages.find((p) => p.pageId === pageId);
      if (pageObj) {
        targetPageName = pageObj.pageName || targetPageName;
        try {
          plainPageToken = decryptToken(pageObj.encryptedPageAccessToken);
        } catch (decryptErr) {
          console.error(`[processLeadgenEvent] Decryption failed for page ${pageId}:`, decryptErr.message);
        }
      }
    }

    // 2. Fetch the full lead record from Meta Graph API using the page token.
    // Never fabricate a phone number or customer name from a webhook envelope.
    if (!plainPageToken) {
      throw new Error(`No page access token available for page ${pageId}`);
    }

    let parsedLead;
    try {
      const rawLead = await fetchLeadDetails(leadgenId, plainPageToken);
      parsedLead = parseLeadFields(rawLead);
    } catch (graphErr) {
      console.warn(`[processLeadgenEvent] Graph API fetch failed for lead ${leadgenId}:`, graphErr.message);
      throw graphErr;
    }

    if (!parsedLead || (!parsedLead.phone && !parsedLead.email)) {
      throw new Error(`Meta lead ${leadgenId} did not contain usable contact details`);
    }

    // 3. Resolve tenantId from a verified integration or an explicit tenant slug.
    let businessId = integration?.businessId;
    if (!businessId && tenantSlug) {
      const targetTenant = await Tenant.findOne({ slug: tenantSlug, status: 'ACTIVE' });
      if (targetTenant) businessId = targetTenant._id;
    }

    if (!businessId) {
      // Never guess a tenant. An unmapped webhook must not write into another merchant's CRM.
      console.warn('[processLeadgenEvent] No mapped business tenant for lead:', leadgenId);
      return;
    }

    // 5. Ingest lead record (deduplicates automatically)
    const ingestResult = await ingestLeadRecord(businessId, parsedLead, {
      pageId,
      pageName: targetPageName,
    });

    console.log(`[processLeadgenEvent] Lead ${leadgenId} processed. New lead saved: ${ingestResult.isNew}`);

    // 6. Record in integration syncLogs
    if (integration && ingestResult.isNew) {
      integration.totalLeadsImported = (integration.totalLeadsImported || 0) + 1;
      integration.lastSyncAt = new Date();
      integration.lastSyncStatus = 'SUCCESS';

      integration.syncLogs.unshift({
        timestamp: new Date(),
        type: 'WEBHOOK',
        status: 'SUCCESS',
        message: `Meta lead received for ${parsedLead.name}. Form: "${parsedLead.metaFormName || formId || 'Unknown form'}"`,
        importedCount: 1,
        pageId,
        formId,
      });

      if (integration.syncLogs.length > 50) {
        integration.syncLogs = integration.syncLogs.slice(0, 50);
      }

      await integration.save();
    }
  } catch (err) {
    console.error('[processLeadgenEvent] Ingestion pipeline failed:', err);
    throw err;
  }
};

module.exports = {
  verifyWebhook,
  handleMetaWebhook,
};
