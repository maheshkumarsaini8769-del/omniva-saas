const Tenant = require('../models/Tenant');
const { sendCapiEvent } = require('../services/metaCapiService');

// Status is derived from actual configuration, never hardcoded.
const deriveStatus = (enabled, hasRequiredFields) => {
  if (!enabled) return 'NOT_CONFIGURED';
  return hasRequiredFields ? 'CONNECTED' : 'INCOMPLETE';
};

// Placeholder/bullet/mock values must not count as real credentials.
const hasRealSecret = (value) =>
  Boolean(value) &&
  !String(value).startsWith('mock_') &&
  !String(value).includes('••••');

// @desc    Get merchant integrations configuration
// @route   GET /api/integrations
// @access  Protected (Merchant Admin/Owner)
const getIntegrations = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.businessId);
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }

    const metaEnabled = Boolean(tenant.integrations?.meta?.enabled);
    const whatsappEnabled = Boolean(tenant.integrations?.whatsapp?.enabled);
    const paymentEnabled = Boolean(tenant.integrations?.payment?.enabled);
    const courierEnabled = Boolean(tenant.integrations?.courier?.enabled);
    const webhooksEnabled = Boolean(tenant.integrations?.webhooks?.enabled);

    const defaultIntegrations = {
      meta: {
        enabled: metaEnabled,
        pixelId: tenant.settings?.metaPixelId || tenant.integrations?.meta?.pixelId || '',
        capiToken: tenant.settings?.metaCapiToken || tenant.integrations?.meta?.capiToken ? '••••••••' : '',
        testEventCode: tenant.integrations?.meta?.testEventCode || '',
        status: deriveStatus(
          metaEnabled,
          Boolean(
            (tenant.settings?.metaPixelId || tenant.integrations?.meta?.pixelId) &&
            hasRealSecret(tenant.settings?.metaCapiToken || tenant.integrations?.meta?.capiToken)
          )
        ),
      },
      whatsapp: {
        enabled: whatsappEnabled,
        senderPhone: tenant.integrations?.whatsapp?.senderPhone || tenant.contact?.phone || '',
        status: deriveStatus(
          whatsappEnabled,
          Boolean(tenant.integrations?.whatsapp?.senderPhone)
        ),
      },
      payment: {
        enabled: paymentEnabled,
        provider: tenant.integrations?.payment?.provider || 'Razorpay',
        keyId: tenant.integrations?.payment?.keyId || '',
        keySecret: tenant.integrations?.payment?.keySecret ? '••••••••••••••••' : '',
        status: deriveStatus(
          paymentEnabled,
          Boolean(
            tenant.integrations?.payment?.keyId &&
            hasRealSecret(tenant.integrations?.payment?.keySecret)
          )
        ),
      },
      courier: {
        enabled: courierEnabled,
        provider: tenant.integrations?.courier?.provider || '',
        apiKey: tenant.integrations?.courier?.apiKey ? '••••••••' : '',
        pickupPincode: tenant.integrations?.courier?.pickupPincode || '',
        status: deriveStatus(
          courierEnabled,
          Boolean(
            tenant.integrations?.courier?.provider &&
            hasRealSecret(tenant.integrations?.courier?.apiKey)
          )
        ),
      },
      webhooks: {
        enabled: webhooksEnabled,
        url: tenant.integrations?.webhooks?.url || '',
        status: deriveStatus(
          webhooksEnabled,
          Boolean(tenant.integrations?.webhooks?.url)
        ),
      },
    };

    res.json({
      success: true,
      integrations: defaultIntegrations,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update merchant integrations configuration
// @route   PUT /api/integrations
// @access  Protected (Merchant Admin/Owner)
const updateIntegrations = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.businessId);
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }

    const { meta, whatsapp, payment, courier, webhooks } = req.body;

    if (!tenant.integrations) {
      tenant.integrations = {};
    }

    // 1. Meta Pixel & CAPI
    if (meta) {
      tenant.integrations.meta = {
        ...tenant.integrations.meta,
        enabled: meta.enabled !== undefined ? Boolean(meta.enabled) : false,
      };
      if (meta.pixelId !== undefined) {
        tenant.integrations.meta.pixelId = meta.pixelId.trim();
        tenant.settings.metaPixelId = meta.pixelId.trim();
      }
      if (meta.capiToken && !meta.capiToken.includes('••••')) {
        tenant.integrations.meta.capiToken = meta.capiToken.trim();
        tenant.settings.metaCapiToken = meta.capiToken.trim();
      }
      if (meta.testEventCode !== undefined) {
        tenant.integrations.meta.testEventCode = meta.testEventCode.trim();
      }
    }

    // 2. WhatsApp
    if (whatsapp) {
      tenant.integrations.whatsapp = {
        ...tenant.integrations.whatsapp,
        enabled: whatsapp.enabled !== undefined ? Boolean(whatsapp.enabled) : false,
      };
      if (whatsapp.senderPhone !== undefined) {
        tenant.integrations.whatsapp.senderPhone = whatsapp.senderPhone.trim();
        if (whatsapp.senderPhone.trim()) {
          tenant.contact.phone = whatsapp.senderPhone.trim();
        }
      }
    }

    // 3. Payment Gateway
    if (payment) {
      tenant.integrations.payment = {
        ...tenant.integrations.payment,
        enabled: payment.enabled !== undefined ? Boolean(payment.enabled) : false,
      };
      if (payment.provider !== undefined) {
        tenant.integrations.payment.provider = payment.provider.trim();
      }
      if (payment.keyId !== undefined) {
        tenant.integrations.payment.keyId = payment.keyId.trim();
      }
      if (payment.keySecret && !payment.keySecret.includes('••••')) {
        tenant.integrations.payment.keySecret = payment.keySecret.trim();
      }
    }

    // 4. Courier & Logistics
    if (courier) {
      tenant.integrations.courier = {
        ...tenant.integrations.courier,
        enabled: courier.enabled !== undefined ? Boolean(courier.enabled) : false,
      };
      if (courier.provider !== undefined) {
        tenant.integrations.courier.provider = courier.provider.trim();
      }
      if (courier.pickupPincode !== undefined) {
        tenant.integrations.courier.pickupPincode = courier.pickupPincode.trim();
      }
      if (courier.apiKey && !courier.apiKey.includes('••••')) {
        tenant.integrations.courier.apiKey = courier.apiKey.trim();
      }
    }

    // 5. Outbound Webhook
    if (webhooks) {
      tenant.integrations.webhooks = {
        ...tenant.integrations.webhooks,
        enabled: webhooks.enabled !== undefined ? Boolean(webhooks.enabled) : false,
      };
      if (webhooks.url !== undefined) {
        tenant.integrations.webhooks.url = webhooks.url.trim();
      }
    }

    await tenant.save();

    res.json({
      success: true,
      message: 'Integration settings saved successfully',
      integrations: {
        meta: {
          enabled: tenant.integrations.meta.enabled,
          pixelId: tenant.integrations.meta.pixelId,
          capiToken: tenant.integrations.meta.capiToken ? '••••••••' : '',
          testEventCode: tenant.integrations.meta.testEventCode,
        },
        whatsapp: {
          enabled: tenant.integrations.whatsapp.enabled,
          senderPhone: tenant.integrations.whatsapp.senderPhone,
        },
        payment: {
          enabled: tenant.integrations.payment.enabled,
          provider: tenant.integrations.payment.provider,
          keyId: tenant.integrations.payment.keyId,
          keySecret: tenant.integrations.payment.keySecret ? '••••••••••••••••' : '',
        },
        courier: {
          enabled: tenant.integrations.courier.enabled,
          provider: tenant.integrations.courier.provider,
          pickupPincode: tenant.integrations.courier.pickupPincode,
          apiKey: tenant.integrations.courier.apiKey ? '••••••••' : '',
        },
        webhooks: {
          enabled: tenant.integrations.webhooks.enabled,
          url: tenant.integrations.webhooks.url,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Test connection for a specific integration service
// @route   POST /api/integrations/test
// @access  Protected (Merchant Admin/Owner)
const testIntegration = async (req, res) => {
  try {
    const { serviceType, payload } = req.body;
    const tenant = await Tenant.findById(req.businessId);
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }

    if (serviceType === 'meta') {
      const pixelId = payload?.pixelId || tenant.integrations?.meta?.pixelId || tenant.settings?.metaPixelId;
      const capiToken = payload?.capiToken || tenant.integrations?.meta?.capiToken || tenant.settings?.metaCapiToken;
      if (!pixelId || !capiToken) {
        return res.status(400).json({
          success: false,
          message: 'Meta Pixel ID and Conversions API token must be configured before testing',
        });
      }
      const result = await sendCapiEvent({
        tenant,
        eventName: 'Lead',
        eventId: `test_${Date.now()}`,
        eventSourceUrl: req.headers.origin || process.env.FRONTEND_URL || undefined,
        userData: { email: req.user?.email || '', phone: '' },
        customData: { currency: 'INR', value: 0, contentName: 'Integration test event' },
      });
      if (!result.success || result.mode === 'SIMULATION') {
        return res.status(400).json({
          success: false,
          message: result.message || 'Meta credentials are not valid for a live test',
          result,
        });
      }
      return res.json({
        success: true,
        message: `Meta Pixel (${pixelId}) & Conversions API test event dispatched successfully`,
        timestamp: new Date().toLocaleTimeString(),
        result,
      });
    }

    if (serviceType === 'whatsapp') {
      const rawPhone = payload?.senderPhone || tenant.integrations?.whatsapp?.senderPhone || tenant.contact?.phone;
      const cleanPhone = (rawPhone || '').replace(/\D/g, '').slice(-10);
      if (!cleanPhone) {
        return res.status(400).json({ success: false, message: 'A WhatsApp sender phone number is required' });
      }
      return res.status(200).json({
        success: false,
        verified: false,
        message: `A chat link can be generated for +91 ${cleanPhone}, but no WhatsApp Business API message was sent. Live verification is not configured.`,
        timestamp: new Date().toLocaleTimeString(),
        phone: cleanPhone,
        chatUrl: `https://wa.me/91${cleanPhone}?text=Hello%20from%20Omniva%20Store`,
      });
    }

    if (serviceType === 'payment') {
      const keyId = payload?.keyId || tenant.integrations?.payment?.keyId;
      if (!keyId) {
        return res.status(400).json({ success: false, message: 'Razorpay Key ID is not configured' });
      }
      const mode = keyId.startsWith('rzp_live_') ? 'Live Mode (Production)' : keyId.startsWith('rzp_test_') ? 'Test Mode (Sandbox)' : 'Custom Mode';
      return res.status(200).json({
        success: false,
        verified: false,
        message: `Razorpay key format recognized [${mode}]. No live API request or charge was made, so this is not a connection verification.`,
        timestamp: new Date().toLocaleTimeString(),
        mode,
      });
    }

    if (serviceType === 'courier') {
      const provider = payload?.provider || tenant.integrations?.courier?.provider;
      const pincode = payload?.pickupPincode || tenant.integrations?.courier?.pickupPincode;
      if (!provider || !pincode) {
        return res.status(400).json({
          success: false,
          message: 'Courier provider and pickup pincode must be configured before testing',
        });
      }
      return res.status(200).json({
        success: false,
        verified: false,
        message: `Courier fields are present for ${provider} at pincode ${pincode}. No courier API request or shipment was made, so serviceability was not verified.`,
        timestamp: new Date().toLocaleTimeString(),
        provider,
        pincode,
      });
    }

    if (serviceType === 'webhooks') {
      const url = payload?.url || tenant.integrations?.webhooks?.url;
      if (!url) {
        return res.status(400).json({ success: false, message: 'Please enter a webhook URL first' });
      }
      return res.status(200).json({
        success: false,
        verified: false,
        message: `Webhook URL is configured as ${url}. No external request was sent, so delivery was not verified.`,
        timestamp: new Date().toLocaleTimeString(),
        url,
      });
    }

    return res.status(400).json({ success: false, message: `Unknown integration type: ${serviceType}` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getIntegrations,
  updateIntegrations,
  testIntegration,
};
