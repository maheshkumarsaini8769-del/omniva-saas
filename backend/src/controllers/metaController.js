const Tenant = require('../models/Tenant');
const Order = require('../models/Order');
const Lead = require('../models/Lead');
const { sendCapiEvent } = require('../services/metaCapiService');
const { isBlankSecret, isMaskedSecret } = require('../utils/tenantSecrets');

// @desc    Get tenant Meta tracking settings
// @route   GET /api/meta/settings
// @access  Protected (Merchant Owner)
const getMetaSettings = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.businessId);
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }

    const host = req.get('host') || 'localhost:5000';
    const protocol = req.protocol || 'http';
    const webhookUrl = `${protocol}://${host}/api/webhooks/meta?tenantSlug=${tenant.slug}`;
    const capiToken =
      tenant.settings?.metaCapiToken || tenant.integrations?.meta?.capiToken;

    res.status(200).json({
      success: true,
      settings: {
        metaPixelId: tenant.settings?.metaPixelId || tenant.integrations?.meta?.pixelId || '',
        hasCapiToken: !!capiToken,
        capiTokenMasked: capiToken ? '••••••••••••••••' : '',
        webhookUrl,
        // The platform-level verify token is a server secret. Merchants only
        // need to know whether webhook verification is configured.
        verifyTokenConfigured: Boolean(process.env.META_WEBHOOK_VERIFY_TOKEN),
        webhookVerificationManagedByPlatform: true,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update tenant Meta tracking settings
// @route   PUT /api/meta/settings
// @access  Protected (Merchant Owner)
const updateMetaSettings = async (req, res) => {
  try {
    const { metaPixelId, metaCapiToken } = req.body;

    const tenant = await Tenant.findById(req.businessId);
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }

    if (metaPixelId !== undefined) {
      const nextPixelId = String(metaPixelId || '').trim();
      tenant.settings.metaPixelId = nextPixelId;
      if (!tenant.integrations) tenant.integrations = {};
      if (!tenant.integrations.meta) tenant.integrations.meta = {};
      tenant.integrations.meta.pixelId = nextPixelId;
    }
    // An empty or masked value means "keep the existing token". Never persist a
    // UI placeholder as the credential.
    if (
      metaCapiToken !== undefined &&
      !isBlankSecret(metaCapiToken) &&
      !isMaskedSecret(metaCapiToken)
    ) {
      const nextToken = String(metaCapiToken).trim();
      tenant.settings.metaCapiToken = nextToken;
      if (!tenant.integrations) tenant.integrations = {};
      if (!tenant.integrations.meta) tenant.integrations.meta = {};
      tenant.integrations.meta.capiToken = nextToken;
    }

    await tenant.save();

    res.status(200).json({
      success: true,
      message: 'Meta tracking settings saved successfully',
      settings: {
        metaPixelId: tenant.settings.metaPixelId,
        hasCapiToken: !!tenant.settings.metaCapiToken,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Trigger a test CAPI event dispatch
// @route   POST /api/meta/test-capi
// @access  Protected (Merchant Owner)
const testCapiDispatch = async (req, res) => {
  try {
    const { eventName = 'Lead', testEmail = '', testPhone = '', value = 0 } = req.body;

    const tenant = await Tenant.findById(req.businessId);
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }

    const result = await sendCapiEvent({
      tenant,
      eventName,
      eventId: `test_${Date.now()}`,
      eventSourceUrl: req.headers.origin || process.env.FRONTEND_URL || undefined,
      userData: {
        email: testEmail,
        phone: testPhone,
      },
      customData: {
        currency: 'INR',
        value: Number(value) || 0,
        contentName: 'Test Conversion Event',
      },
    });

    res.status(200).json({
      success: result.success,
      message: result.message || 'CAPI event dispatch complete',
      result,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get aggregated Meta marketing & ad campaign analytics
// @route   GET /api/meta/analytics
// @access  Protected (Merchant Owner & Staff)
const getAttributionAnalytics = async (req, res) => {
  try {
    const businessId = req.businessId;
    const { startDate, endDate } = req.query;

    const filter = { businessId };
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    const [orders, leads] = await Promise.all([
      Order.find(filter).lean(),
      Lead.find(filter).lean(),
    ]);

    const instaOrders = orders.filter((o) => {
      const src = (o.attribution?.utmSource || o.attribution?.referrer || '').toLowerCase();
      const med = (o.attribution?.utmMedium || '').toLowerCase();
      return src.includes('instagram') || med.includes('reels') || med.includes('story');
    });

    const fbOrders = orders.filter((o) => {
      const src = (o.attribution?.utmSource || o.attribution?.referrer || '').toLowerCase();
      const med = (o.attribution?.utmMedium || '').toLowerCase();
      return src.includes('facebook') || med.includes('feed') || med.includes('carousel');
    });

    const waOrders = orders.filter((o) => {
      const src = (o.attribution?.utmSource || o.attribution?.referrer || '').toLowerCase();
      return src.includes('whatsapp');
    });

    const calcRev = (list) =>
      list.filter((o) => o.orderStatus !== 'CANCELLED').reduce((s, o) => s + (o.totalAmount || 0), 0);

    const instaRev = calcRev(instaOrders);
    const fbRev = calcRev(fbOrders);
    const waRev = calcRev(waOrders);
    const totalRev = calcRev(orders);
    const directRev = Math.max(0, totalRev - (instaRev + fbRev + waRev));

    const totalMetaOrders =
      instaOrders.filter((o) => o.orderStatus !== 'CANCELLED').length +
      fbOrders.filter((o) => o.orderStatus !== 'CANCELLED').length;
    const totalMetaRev = instaRev + fbRev;

    // Aggregate campaigns only when an order or lead has a real UTM campaign.
    // Unattributed traffic is never relabeled as a Meta campaign.
    const campaignMap = {};
    orders.forEach((o) => {
      const cmp = String(o.attribution?.utmCampaign || '').trim();
      if (!cmp) return;
      if (!campaignMap[cmp]) {
        const source = String(o.attribution?.utmSource || '').toLowerCase();
        campaignMap[cmp] = {
          name: cmp,
          platform: source.includes('instagram')
            ? 'INSTAGRAM'
            : source.includes('facebook')
            ? 'FACEBOOK'
            : 'META_ADS',
          orders: 0,
          revenue: 0,
          leads: 0,
          spend: null,
        };
      }
      if (o.orderStatus !== 'CANCELLED') {
        campaignMap[cmp].orders += 1;
        campaignMap[cmp].revenue += o.totalAmount || 0;
      }
    });

    leads.forEach((l) => {
      const cmp = String(l.campaignName || l.utmCampaign || '').trim();
      if (!cmp) return;
      if (!campaignMap[cmp]) {
        campaignMap[cmp] = {
          name: cmp,
          platform: l.platform === 'ig' ? 'INSTAGRAM' : l.platform === 'fb' ? 'FACEBOOK' : 'META_ADS',
          orders: 0,
          revenue: 0,
          leads: 0,
          spend: null,
        };
      }
      campaignMap[cmp].leads += 1;
    });

    const topCampaigns = Object.values(campaignMap).map((c) => ({
      ...c,
      roas: c.spend > 0 ? (c.revenue / c.spend).toFixed(1) + 'x' : null,
      cpa: c.spend > 0 && c.orders > 0 ? '₹' + Math.round(c.spend / c.orders) : null,
    }));


    const tenant = await Tenant.findById(req.businessId)
      .select(
        'settings.metaPixelId settings.metaCapiToken integrations.meta.pixelId integrations.meta.capiToken'
      )
      .lean();
    const capiConfigured = Boolean(
      (tenant?.settings?.metaPixelId || tenant?.integrations?.meta?.pixelId) &&
        (tenant?.settings?.metaCapiToken || tenant?.integrations?.meta?.capiToken)
    );

    res.json({
      success: true,
      data: {
        summary: {
          totalRevenue: totalRev,
          totalMetaRevenue: totalMetaRev,
          totalOrders: orders.length,
          totalMetaOrders,
          metaRevenueSharePct: totalRev > 0 ? Math.round((totalMetaRev / totalRev) * 100) : 0,
          blendedRoas: null,
          averageAov: orders.filter((o) => o.orderStatus !== 'CANCELLED').length > 0
            ? Math.round(totalRev / orders.filter((o) => o.orderStatus !== 'CANCELLED').length)
            : 0,
        },
        channels: {
          instagram: { count: instaOrders.filter((o) => o.orderStatus !== 'CANCELLED').length, revenue: instaRev },
          facebook: { count: fbOrders.filter((o) => o.orderStatus !== 'CANCELLED').length, revenue: fbRev },
          whatsapp: { count: waOrders.filter((o) => o.orderStatus !== 'CANCELLED').length, revenue: waRev },
          direct: { count: Math.max(0, orders.length - totalMetaOrders - waOrders.length), revenue: directRev },
        },
        campaigns: topCampaigns,
        capiHealth: {
          configured: capiConfigured,
          status: capiConfigured ? 'CONFIGURED' : 'NOT_CONFIGURED',
        },
        adSpend: {
          synced: false,
          message: 'Meta Ads spend is not imported. Revenue and order counts are first-party order data.',
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getMetaSettings,
  updateMetaSettings,
  testCapiDispatch,
  getAttributionAnalytics,
};
