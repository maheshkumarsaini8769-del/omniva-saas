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
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const expectedToken =
    process.env.META_WEBHOOK_VERIFY_TOKEN || 'omniva_meta_verify_token_2026';

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
    // 1. Signature Verification (if App Secret is configured)
    const signature = req.headers['x-hub-signature-256'];
    const appSecret = process.env.META_APP_SECRET;

    if (appSecret && signature && req.rawBody) {
      const isValid = verifyMetaWebhookSignature(req.rawBody, signature, appSecret);
      if (!isValid) {
        console.warn('[Meta Webhook] Signature verification failed! Request rejected.');
        return res.status(403).json({ success: false, message: 'Invalid X-Hub-Signature-256' });
      }
    }

    const { object, entry } = req.body || {};

    // Promptly acknowledge Meta with 200 OK within 3000ms
    res.status(200).json({ success: true, message: 'EVENT_RECEIVED' });

    // Process webhook entries asynchronously
    if (!entry || !Array.isArray(entry)) {
      return;
    }

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

          // Asynchronously process the leadgen event
          processLeadgenEvent(pageId, leadgenId, formId, adId, value).catch((err) => {
            console.error('[Meta Webhook] Error processing leadgen event:', err);
          });
        }
      }
    }
  } catch (error) {
    console.error('[Meta Webhook Handler Error]', error);
    // Ensure 200 OK is sent if not already sent
    if (!res.headersSent) {
      res.status(200).json({ success: false, error: error.message });
    }
  }
};

/**
 * Asynchronously retrieve full lead details from Meta Graph API and ingest into tenant CRM.
 */
const processLeadgenEvent = async (pageId, leadgenId, formId, adId, payloadValue = {}) => {
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

    let parsedLead = null;

    // 2. Fetch full lead record from Meta Graph API using page access token
    if (plainPageToken) {
      try {
        const rawLead = await fetchLeadDetails(leadgenId, plainPageToken);
        parsedLead = parseLeadFields(rawLead);
      } catch (graphErr) {
        console.warn(`[processLeadgenEvent] Graph API fetch failed for lead ${leadgenId}:`, graphErr.message);
      }
    }

    // 3. Fallback: If mock or test lead payload provided in webhook body
    if (!parsedLead) {
      parsedLead = {
        name: payloadValue.name || payloadValue.full_name || `Meta Lead #${leadgenId.slice(-4)}`,
        phone: payloadValue.phone || payloadValue.phone_number || '9876500000',
        email: payloadValue.email || '',
        campaignName: payloadValue.campaign_name || 'Meta Instant Form Campaign',
        adSetName: payloadValue.adset_name || '',
        adName: payloadValue.ad_name || `Ad ${adId || 'Creative'}`,
        platform: payloadValue.platform || 'fb',
        metaLeadId: leadgenId,
        metaFormId: formId || '',
        metaFormName: payloadValue.form_name || '',
        metaAdId: adId || '',
        formAnswers: [],
        customMap: {},
      };
    }

    // 4. Resolve tenantId
    let businessId = integration?.businessId;
    if (!businessId) {
      const activeTenant = await Tenant.findOne({ status: 'ACTIVE' });
      businessId = activeTenant?._id;
    }

    if (!businessId) {
      console.warn('[processLeadgenEvent] No target business tenant found for lead:', leadgenId);
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
        message: `Real-time Meta Lead received for ${parsedLead.name} (${parsedLead.phone}). Form: "${parsedLead.metaFormName || formId || 'Default'}"`,
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
  }
};

module.exports = {
  verifyWebhook,
  handleMetaWebhook,
};
