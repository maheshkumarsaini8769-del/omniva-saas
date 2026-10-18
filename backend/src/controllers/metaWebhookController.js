const Tenant = require('../models/Tenant');
const Lead = require('../models/Lead');
const { triggerAutomation } = require('../services/automationEngine');

// @desc    Verify Meta Webhook subscription
// @route   GET /api/webhooks/meta
// @access  Public (Meta Verification)
const verifyWebhook = (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const expectedToken =
    process.env.META_WEBHOOK_VERIFY_TOKEN || 'omniva_meta_verify_token_2026';

  if (mode === 'subscribe' && token === expectedToken) {
    console.log('[Meta Webhook] Verification successful');
    return res.status(200).send(challenge);
  }

  console.warn('[Meta Webhook] Verification token mismatch');
  return res.status(403).json({ success: false, message: 'Verification token mismatch' });
};

// @desc    Handle inbound Meta Lead Ads Webhook notification
// @route   POST /api/webhooks/meta
// @access  Public (Meta Webhook Ingestion)
const handleMetaWebhook = async (req, res) => {
  try {
    const { object, entry, tenantSlug, tenantId } = req.body;
    const querySlug = req.query.tenantSlug || tenantSlug;
    const queryTenantId = req.query.tenantId || tenantId;

    // Resolve target tenant
    let tenant = null;
    if (querySlug) {
      tenant = await Tenant.findOne({ slug: querySlug.toLowerCase() });
    } else if (queryTenantId) {
      tenant = await Tenant.findById(queryTenantId);
    } else {
      // Fallback to active tenant if not specified
      tenant = await Tenant.findOne({ status: 'ACTIVE' });
    }

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Unable to route Meta Lead. Tenant not found.',
      });
    }

    // Process entries (Meta Leadgen structure)
    if (entry && Array.isArray(entry)) {
      for (const item of entry) {
        if (item.changes && Array.isArray(item.changes)) {
          for (const change of item.changes) {
            if (change.field === 'messages') {
              const val = change.value || {};
              console.log('[WhatsApp Webhook Event Received]:', {
                contacts: val.contacts,
                messages: val.messages,
                statuses: val.statuses,
              });
            } else if (change.field === 'leadgen') {
              const value = change.value || {};
              const leadgenId = value.leadgen_id;
              const adId = value.ad_id;
              const formId = value.form_id;

              // Check if mock / payload data was passed directly for instant ingestion
              const leadName = value.name || value.full_name || `Meta Lead #${leadgenId || Date.now().toString().slice(-4)}`;
              const leadPhone = value.phone || value.phone_number || '9876500000';
              const leadEmail = value.email || '';
              const campaignName = value.campaign_name || 'Meta Instant Form Campaign';
              const adName = value.ad_name || `Ad ${adId || 'Creative'}`;

              // Check for existing lead with same phone in this tenant
              const existingLead = await Lead.findOne({
                businessId: tenant._id,
                phone: leadPhone.trim(),
              });

              const createdLead = await Lead.create({
                businessId: tenant._id,
                name: leadName.trim(),
                phone: leadPhone.trim(),
                email: leadEmail.trim().toLowerCase(),
                source: 'META_ADS',
                campaignName,
                adName,
                budget: Number(value.budget) || 0,
                customFields: {
                  formId: String(formId || ''),
                  leadgenId: String(leadgenId || ''),
                },
                notes: [
                  {
                    note: `[Meta Lead Ingested] Automatically received from Facebook/Instagram Instant Form (ID: ${formId || 'N/A'}).`,
                    authorName: 'Meta Ads Webhook',
                  },
                ],
              });

              triggerAutomation({
                businessId: tenant._id,
                trigger: 'LEAD_INGESTED',
                entityType: 'LEAD',
                entityId: createdLead._id.toString(),
                data: {
                  customerName: createdLead.name,
                  customerPhone: createdLead.phone,
                  source: 'META_ADS',
                  campaignName: createdLead.campaignName,
                  budget: createdLead.budget,
                },
              }).catch((e) => console.error('[Meta Lead Automation Warning]:', e.message));
            }
          }
        }
      }
    } else if (req.body.name && req.body.phone) {
      // Direct testing payload format
      const { name, phone, email, campaignName, adSetName, adName, budget } = req.body;

      const createdLead = await Lead.create({
        businessId: tenant._id,
        name: name.trim(),
        phone: phone.trim(),
        email: email ? email.trim().toLowerCase() : '',
        source: 'META_ADS',
        campaignName: campaignName || 'Meta Ads Instant Campaign',
        adSetName: adSetName || '',
        adName: adName || '',
        budget: Number(budget) || 0,
        notes: [
          {
            note: '[Meta Lead Ingested] Direct webhook lead payload captured.',
            authorName: 'Meta Ads Webhook',
          },
        ],
      });

      triggerAutomation({
        businessId: tenant._id,
        trigger: 'LEAD_INGESTED',
        entityType: 'LEAD',
        entityId: createdLead._id.toString(),
        data: {
          customerName: createdLead.name,
          customerPhone: createdLead.phone,
          source: 'META_ADS',
          campaignName: createdLead.campaignName,
          budget: createdLead.budget,
        },
      }).catch((e) => console.error('[Meta Lead Automation Warning]:', e.message));
    }

    // Always acknowledge Meta with 200 OK within 2000ms
    res.status(200).json({
      success: true,
      message: 'Meta Webhook received and processed successfully',
      tenantId: tenant._id,
      tenantSlug: tenant.slug,
    });
  } catch (error) {
    console.error('[Meta Webhook Handler Error]', error);
    // Still return 200 to prevent Meta from retrying and flooding
    res.status(200).json({
      success: false,
      error: error.message,
    });
  }
};

module.exports = {
  verifyWebhook,
  handleMetaWebhook,
};
