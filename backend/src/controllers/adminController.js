const Tenant = require('../models/Tenant');
const User = require('../models/User');
const Order = require('../models/Order');
const Booking = require('../models/Booking');
const Lead = require('../models/Lead');
const { PLAN_LIMITS } = require('../config/plans');
const {
  isBlankSecret,
  isMaskedSecret,
  mergeTenantIntegrations,
  redactIntegrationSecrets,
  redactTenantSecrets,
} = require('../utils/tenantSecrets');

// @desc    Get all merchants for Super Admin
// @route   GET /api/admin/merchants
// @access  Private (SUPER_ADMIN, SUPER_STAFF)
const getAllMerchants = async (req, res) => {
  try {
    // Do not spread integration credentials or the legacy CAPI token to
    // SUPER_STAFF. Secrets are available only via the SUPER_ADMIN-only endpoint.
    const tenants = await Tenant.find()
      .select('-integrations -settings.metaCapiToken')
      .sort({ createdAt: -1 })
      .lean();

    const enriched = await Promise.all(
      tenants.map(async (t) => {
        const [ordersCount, bookingsCount, leadsCount, ownerUser, staffCount, activeStaffCount, revenueResult] = await Promise.all([
          Order.countDocuments({ businessId: t._id }),
          Booking.countDocuments({ businessId: t._id }),
          Lead.countDocuments({ businessId: t._id }),
          User.findOne({ businessId: t._id, role: 'MERCHANT_OWNER' }).lean(),
          User.countDocuments({ businessId: t._id, role: { $ne: 'MERCHANT_OWNER' } }),
          User.countDocuments({ businessId: t._id, role: { $ne: 'MERCHANT_OWNER' }, isActive: true }),
          Order.aggregate([
            { $match: { businessId: t._id, orderStatus: { $ne: 'CANCELLED' } } },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } },
          ]),
        ]);
        const revenue = revenueResult[0]?.total || 0;

        return {
          ...t,
          ownerName: ownerUser ? ownerUser.name : '',
          ownerEmail: ownerUser ? ownerUser.email : '',
          ordersCount,
          bookingsCount,
          leadsCount,
          staffCount,
          activeStaffCount,
          revenue,
        };
      })
    );

    res.json({ success: true, count: enriched.length, data: enriched });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update merchant template & enabled modules by Super Admin
// @route   PATCH /api/admin/merchants/:id/template
// @access  Private (SUPER_ADMIN)
const updateMerchantTemplate = async (req, res) => {
  try {
    const { templateCode, businessType, enabledModules, planTier, status } = req.body;
    const tenant = await Tenant.findById(req.params.id);

    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Merchant not found' });
    }

    if (templateCode) {
      tenant.templateCode = templateCode;
      tenant.businessType = businessType || templateCode;

      // Auto-configure modules according to selected business template
      if (!enabledModules) {
        if (templateCode === 'PRODUCT') {
          tenant.enabledModules = {
            products: true,
            orders: true,
            inventory: true,
            serviceBookings: false,
            travelBookings: false,
            crmLeads: true,
            marketingAds: true,
            automations: true,
          };
        } else if (templateCode === 'TRAVEL') {
          tenant.enabledModules = {
            products: false,
            orders: false,
            inventory: false,
            serviceBookings: false,
            travelBookings: true,
            crmLeads: true,
            marketingAds: true,
            automations: true,
          };
        } else if (templateCode === 'SERVICE') {
          tenant.enabledModules = {
            products: false,
            orders: false,
            inventory: false,
            serviceBookings: true,
            travelBookings: false,
            crmLeads: true,
            marketingAds: true,
            automations: true,
          };
        } else {
          // Custom template allows all
          tenant.enabledModules = {
            products: true,
            orders: true,
            inventory: true,
            serviceBookings: true,
            travelBookings: true,
            crmLeads: true,
            marketingAds: true,
            automations: true,
          };
        }
      }
    }

    if (enabledModules) {
      tenant.enabledModules = {
        ...tenant.enabledModules,
        ...enabledModules,
      };
    }

    if (planTier) tenant.planTier = planTier;
    if (status) tenant.status = status;

    await tenant.save();

    res.json({
      success: true,
      message: `Merchant template updated to ${tenant.templateCode} successfully`,
      data: redactTenantSecrets(tenant),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Directly toggle individual modules for a merchant by Super Admin
// @route   PATCH /api/admin/merchants/:id/modules
// @access  Private (SUPER_ADMIN)
const updateMerchantModules = async (req, res) => {
  try {
    const { enabledModules } = req.body;
    const tenant = await Tenant.findById(req.params.id);

    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Merchant not found' });
    }

    if (!enabledModules || typeof enabledModules !== 'object') {
      return res.status(400).json({ success: false, message: 'enabledModules object is required' });
    }

    tenant.enabledModules = {
      ...tenant.enabledModules,
      ...enabledModules,
    };

    await tenant.save();

    res.json({
      success: true,
      message: `Merchant modules updated successfully for ${tenant.businessName}`,
      data: redactTenantSecrets(tenant),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    List merchant staff accounts for Super Admin
// @route   GET /api/admin/merchants/:id/staff
// @access  Private (SUPER_ADMIN, SUPER_STAFF)
const getMerchantStaff = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id).select('_id businessName');
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Merchant not found' });
    }
    const staff = await User.find({ businessId: tenant._id })
      .select('name email role isActive createdAt')
      .sort({ createdAt: 1 })
      .lean();
    res.json({ success: true, data: staff });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current-month quota usage for a merchant
// @route   GET /api/admin/merchants/:id/usage
// @access  Private (SUPER_ADMIN, SUPER_STAFF)
const getMerchantUsage = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id).select('_id businessName planTier subscription');
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Merchant not found' });
    }
    const limits = PLAN_LIMITS[tenant.planTier] || PLAN_LIMITS.GROWTH;
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const [ordersThisMonth, leadsThisMonth, staffCount] = await Promise.all([
      Order.countDocuments({ businessId: tenant._id, createdAt: { $gte: periodStart } }),
      Lead.countDocuments({ businessId: tenant._id, createdAt: { $gte: periodStart } }),
      User.countDocuments({ businessId: tenant._id, role: { $ne: 'MERCHANT_OWNER' } }),
    ]);
    res.json({
      success: true,
      data: {
        planTier: tenant.planTier,
        planName: limits.name,
        limits,
        periodStart: periodStart.toISOString(),
        usage: { ordersThisMonth, leadsThisMonth, staffCount },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get merchant integrations & API keys for Super Admin
// @route   GET /api/admin/merchants/:id/integrations
// @access  Private (SUPER_ADMIN, SUPER_STAFF)
const getMerchantIntegrations = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Merchant not found' });
    }

    res.json({
      success: true,
      businessName: tenant.businessName,
      slug: tenant.slug,
      // SUPER_ADMIN can provision credentials but never read them back.
      integrations: redactIntegrationSecrets(
        tenant.integrations?.toObject
          ? tenant.integrations.toObject({ getters: false })
          : tenant.integrations
      ),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update & provision merchant integrations & API keys by Super Admin
// @route   PUT /api/admin/merchants/:id/integrations
// @access  Private (SUPER_ADMIN)
const updateMerchantIntegrations = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Merchant not found' });
    }

    const { integrations } = req.body;
    if (!integrations || typeof integrations !== 'object' || Array.isArray(integrations)) {
      return res.status(400).json({ success: false, message: 'integrations object is required' });
    }

    const existingIntegrations =
      tenant.integrations?.toObject
        ? tenant.integrations.toObject({ getters: false })
        : tenant.integrations || {};

    // Deep-merge per connector so a partial admin update cannot erase unrelated
    // fields. Blank or masked secret values mean "keep what is already stored".
    tenant.integrations = mergeTenantIntegrations(existingIntegrations, integrations);

    // Keep the legacy settings copy in sync only when a real new Meta token or
    // pixel ID was supplied. Never copy a mask into the credential field.
    if (integrations.meta && typeof integrations.meta === 'object') {
      if (integrations.meta.pixelId !== undefined) {
        tenant.settings.metaPixelId = String(integrations.meta.pixelId || '').trim();
      }
      if (
        integrations.meta.capiToken !== undefined &&
        !isBlankSecret(integrations.meta.capiToken) &&
        !isMaskedSecret(integrations.meta.capiToken)
      ) {
        tenant.settings.metaCapiToken = String(integrations.meta.capiToken).trim();
      }
    }

    await tenant.save();

    res.json({
      success: true,
      message: `Integrations & API keys successfully provisioned for ${tenant.businessName}`,
      data: redactIntegrationSecrets(
        tenant.integrations?.toObject
          ? tenant.integrations.toObject({ getters: false })
          : tenant.integrations
      ),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Test connection to external service for a merchant
// @route   POST /api/admin/merchants/:id/integrations/test
// @access  Private (SUPER_ADMIN)
const testMerchantIntegration = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Merchant not found' });
    }

    const { serviceType } = req.body;

    let details = null;

    if (serviceType === 'meta') {
      const pixelId = tenant.integrations?.meta?.pixelId || tenant.settings?.metaPixelId;
      if (!pixelId) {
        return res.status(400).json({ success: false, message: 'Meta Pixel ID is not configured for this merchant' });
      }
      details = { pixelId, graphApiVersion: 'v21.0', capiConfigured: Boolean(tenant.integrations?.meta?.capiToken || tenant.settings?.metaCapiToken) };
    } else if (serviceType === 'whatsapp') {
      const wabaId = tenant.integrations?.whatsapp?.wabaId;
      const phoneNumber = tenant.integrations?.whatsapp?.senderPhone;
      if (!wabaId && !phoneNumber) {
        return res.status(400).json({ success: false, message: 'WhatsApp credentials are not configured for this merchant' });
      }
      details = { wabaId: wabaId || '', phoneNumber: phoneNumber || '' };
    } else if (serviceType === 'courier') {
      const provider = tenant.integrations?.courier?.provider;
      const pickupPincode = tenant.integrations?.courier?.pickupPincode;
      if (!provider || !pickupPincode) {
        return res.status(400).json({ success: false, message: 'Courier provider and pickup pincode are not configured' });
      }
      details = { provider, pickupPincode };
    } else if (serviceType === 'payment') {
      const keyId = tenant.integrations?.payment?.keyId;
      if (!keyId) {
        return res.status(400).json({ success: false, message: 'Payment gateway key is not configured for this merchant' });
      }
      details = {
        provider: tenant.integrations?.payment?.provider || 'Razorpay',
        keyId,
        liveMode: Boolean(tenant.integrations?.payment?.liveMode),
      };
    } else {
      return res.status(400).json({ success: false, message: `Unknown integration type: ${serviceType}` });
    }

    res.json({
      success: true,
      message: `${serviceType.toUpperCase()} configuration found. No live request was made.`,
      diagnostic: {
        service: serviceType,
        status: 'CONFIGURED',
        testedAt: new Date().toISOString(),
        details,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new merchant and owner account by Super Admin
// @route   POST /api/admin/merchants
// @access  Private (SUPER_ADMIN)
const createMerchant = async (req, res) => {
  try {
    const {
      businessName,
      slug,
      businessType = 'PRODUCT',
      templateCode = 'PRODUCT',
      planTier = 'GROWTH',
      ownerName,
      ownerEmail,
      password,
      phone = '',
      enabledModules,
    } = req.body;

    if (!businessName || !ownerEmail) {
      return res.status(400).json({ success: false, message: 'Business name and owner email are required' });
    }

    if (!password || String(password).length < 8) {
      return res.status(400).json({
        success: false,
        message: 'A password of at least 8 characters is required for the merchant owner',
      });
    }

    const finalSlug = (slug || businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')) + '-' + Date.now().toString().slice(-4);

    const existingUser = await User.findOne({ email: ownerEmail.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    let modules = enabledModules;
    if (!modules) {
      if (templateCode === 'PRODUCT') {
        modules = { products: true, orders: true, inventory: true, serviceBookings: false, travelBookings: false, crmLeads: true, marketingAds: true, automations: true };
      } else if (templateCode === 'TRAVEL') {
        modules = { products: false, orders: false, inventory: false, serviceBookings: false, travelBookings: true, crmLeads: true, marketingAds: true, automations: true };
      } else if (templateCode === 'SERVICE') {
        modules = { products: false, orders: false, inventory: false, serviceBookings: true, travelBookings: false, crmLeads: true, marketingAds: true, automations: true };
      } else {
        modules = { products: true, orders: true, inventory: true, serviceBookings: true, travelBookings: true, crmLeads: true, marketingAds: true, automations: true };
      }
    }

    const tenant = await Tenant.create({
      businessName,
      slug: finalSlug,
      businessType,
      templateCode,
      planTier,
      status: 'ACTIVE',
      enabledModules: modules,
      contact: { email: ownerEmail, phone },
    });

    // User.create runs the model's pre-save hook, which hashes the password once.
    // Do NOT hash it here or the stored hash will be double-hashed and unusable.
    const user = await User.create({
      name: ownerName || businessName + ' Owner',
      email: ownerEmail.toLowerCase().trim(),
      password,
      role: 'MERCHANT_OWNER',
      businessId: tenant._id,
      phone,
      isActive: true,
    });

    res.status(201).json({
      success: true,
      message: `Merchant ${businessName} created successfully`,
      data: {
        ...tenant.toObject(),
        ownerName: user.name,
        ownerEmail: user.email,
        ordersCount: 0,
        bookingsCount: 0,
        leadsCount: 0,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a merchant's business profile and owner identity
// @route   PATCH /api/admin/merchants/:id
// @access  Private (SUPER_ADMIN)
const updateMerchantProfile = async (req, res) => {
  try {
    const {
      businessName,
      ownerName,
      ownerEmail,
      contactEmail,
      contactPhone,
      contactAddress,
      planTier,
    } = req.body;

    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Merchant not found' });
    }

    if (businessName !== undefined) {
      const cleanName = String(businessName || '').trim();
      if (!cleanName) {
        return res.status(400).json({ success: false, message: 'Business name cannot be empty' });
      }
      tenant.businessName = cleanName;
    }

    if (!tenant.contact) tenant.contact = {};
    if (contactEmail !== undefined) tenant.contact.email = String(contactEmail || '').trim();
    if (contactPhone !== undefined) tenant.contact.phone = String(contactPhone || '').trim();
    if (contactAddress !== undefined) tenant.contact.address = String(contactAddress || '').trim();

    if (planTier !== undefined) {
      const normalizedPlan = String(planTier || '').toUpperCase();
      if (!['STARTER', 'GROWTH', 'PRO'].includes(normalizedPlan)) {
        return res.status(400).json({ success: false, message: 'Invalid plan tier' });
      }
      tenant.planTier = normalizedPlan;
    }

    const owner = await User.findOne({ businessId: tenant._id, role: 'MERCHANT_OWNER' });
    if (ownerName !== undefined) {
      const cleanOwnerName = String(ownerName || '').trim();
      if (!cleanOwnerName) {
        return res.status(400).json({ success: false, message: 'Owner name cannot be empty' });
      }
      if (owner) owner.name = cleanOwnerName;
    }
    if (ownerEmail !== undefined) {
      const cleanEmail = String(ownerEmail || '').trim().toLowerCase();
      if (!cleanEmail || !cleanEmail.includes('@')) {
        return res.status(400).json({ success: false, message: 'A valid owner email is required' });
      }
      const conflictingUser = await User.findOne({
        email: cleanEmail,
        _id: { $ne: owner?._id || null },
      }).select('_id');
      if (conflictingUser) {
        return res.status(409).json({ success: false, message: 'Owner email is already in use by another account' });
      }
      if (owner) owner.email = cleanEmail;
      tenant.contact.email = cleanEmail;
    }

    await tenant.save();
    if (owner) await owner.save();

    res.json({
      success: true,
      message: `Merchant profile updated for ${tenant.businessName}`,
      data: {
        ...tenant.toObject(),
        ownerName: owner?.name || '',
        ownerEmail: owner?.email || '',
      },
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ success: false, message: 'Email or slug is already in use' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update merchant status (Active, Suspended, Pending)
// @route   PATCH /api/admin/merchants/:id/status
// @access  Private (SUPER_ADMIN)
const updateMerchantStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['ACTIVE', 'SUSPENDED', 'PENDING'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Valid status is required (ACTIVE, SUSPENDED, PENDING)' });
    }

    const tenant = await Tenant.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Merchant not found' });
    }

    // Also update associated owner user active state
    await User.updateMany(
      { businessId: tenant._id },
      { isActive: status === 'ACTIVE' }
    );

    res.json({
      success: true,
      message: `Merchant status updated to ${status}`,
      data: redactTenantSecrets(tenant),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get the backend plan catalog and limits
// @route   GET /api/admin/plans
// @access  Private (SUPER_ADMIN, SUPER_STAFF)
const getPlatformPlans = async (req, res) => {
  res.json({ success: true, data: PLAN_LIMITS });
};

// @desc    Get aggregate platform metrics
// @route   GET /api/admin/stats
// @access  Private (SUPER_ADMIN, SUPER_STAFF)
const getPlatformStats = async (req, res) => {
  try {
    const [totalMerchants, activeMerchants, totalOrders, totalBookings, totalLeads, activeSubscriptions] = await Promise.all([
      Tenant.countDocuments(),
      Tenant.countDocuments({ status: 'ACTIVE' }),
      Order.countDocuments(),
      Booking.countDocuments(),
      Lead.countDocuments(),
      Tenant.countDocuments({ 'subscription.status': 'ACTIVE' }),
    ]);

    const ordersRevenue = await Order.aggregate([
      { $match: { orderStatus: { $ne: 'CANCELLED' } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);

    const totalRevenue = ordersRevenue[0]?.total || 0;

    res.json({
      success: true,
      data: {
        totalMerchants,
        activeMerchants,
        totalOrders,
        totalBookings,
        totalLeads,
        totalRevenue,
        activeSubscriptions,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllMerchants,
  createMerchant,
  updateMerchantStatus,
  updateMerchantProfile,
  getPlatformStats,
  getPlatformPlans,
  updateMerchantTemplate,
  updateMerchantModules,
  getMerchantStaff,
  getMerchantUsage,
  getMerchantIntegrations,
  updateMerchantIntegrations,
  testMerchantIntegration,
};
