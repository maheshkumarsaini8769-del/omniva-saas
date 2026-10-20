const mongoose = require('mongoose');

const tenantSchema = new mongoose.Schema(
  {
    businessName: {
      type: String,
      required: [true, 'Business name is required'],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, 'Business slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    businessType: {
      type: String,
      enum: ['PRODUCT', 'SERVICE', 'TRAVEL', 'RESTAURANT', 'SALON', 'CUSTOM'],
      default: 'PRODUCT',
      index: true,
    },
    templateCode: {
      type: String,
      enum: ['PRODUCT', 'SERVICE', 'TRAVEL', 'RESTAURANT', 'SALON', 'CUSTOM'],
      default: 'PRODUCT',
    },
    enabledModules: {
      products: { type: Boolean, default: true },
      orders: { type: Boolean, default: true },
      inventory: { type: Boolean, default: true },
      serviceBookings: { type: Boolean, default: false },
      travelBookings: { type: Boolean, default: false },
      crmLeads: { type: Boolean, default: true },
      marketingAds: { type: Boolean, default: true },
      automations: { type: Boolean, default: true },
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'PENDING', 'SUSPENDED'],
      default: 'ACTIVE',
      index: true,
    },
    planTier: {
      type: String,
      enum: ['STARTER', 'GROWTH', 'PRO'],
      default: 'GROWTH',
    },
    subscription: {
      status: {
        type: String,
        enum: ['ACTIVE', 'TRIAL', 'PAST_DUE', 'CANCELED'],
        default: 'ACTIVE',
      },
      billingCycle: {
        type: String,
        enum: ['MONTHLY', 'ANNUAL'],
        default: 'MONTHLY',
      },
      currentPeriodStart: {
        type: Date,
        default: Date.now,
      },
      currentPeriodEnd: {
        type: Date,
        default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    },
    branding: {
      logo: { type: String, default: '' },
      tagline: { type: String, default: '' },
      primaryColor: { type: String, default: '#4f46e5' },
      secondaryColor: { type: String, default: '#06b6d4' },
    },
    contact: {
      phone: { type: String, default: '' },
      email: { type: String, default: '' },
      address: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      pincode: { type: String, default: '' },
    },
    settings: {
      currency: { type: String, default: 'INR' },
      currencySymbol: { type: String, default: '₹' },
      enableCOD: { type: Boolean, default: true },
      enableOnlinePay: { type: Boolean, default: true },
      gstinNumber: { type: String, default: '' },
      minOrderValue: { type: Number, default: 0, min: 0 },
      shippingFee: { type: Number, default: 50, min: 0 },
      freeShippingThreshold: { type: Number, default: 499, min: 0 },
      sendOrderNotifications: { type: Boolean, default: true },
      whatsappAlerts: { type: Boolean, default: true },
      merchantUpiId: { type: String, default: '' },
      metaPixelId: { type: String, default: '' },
      metaCapiToken: { type: String, default: '' },
    },
    customDomain: {
      type: String,
      default: null,
    },
    integrations: {
      managedBySuperAdmin: { type: Boolean, default: true },
      meta: {
        // Empty until a merchant explicitly connects Meta. Avoid fake "live" state.
        enabled: { type: Boolean, default: false },
        pixelId: { type: String, default: '' },
        capiToken: { type: String, default: '' },
        testEventCode: { type: String, default: '' },
        datasetId: { type: String, default: '' },
        status: { type: String, default: 'NOT_CONFIGURED' },
        lastSyncedAt: { type: Date, default: Date.now },
      },
      whatsapp: {
        enabled: { type: Boolean, default: false },
        wabaId: { type: String, default: '' },
        phoneNumberId: { type: String, default: '' },
        accessToken: { type: String, default: '' },
        senderPhone: { type: String, default: '' },
        status: { type: String, default: 'NOT_CONFIGURED' },
        lastSyncedAt: { type: Date, default: Date.now },
      },
      courier: {
        enabled: { type: Boolean, default: false },
        provider: { type: String, default: '' },
        apiKey: { type: String, default: '' },
        apiSecret: { type: String, default: '' },
        pickupPincode: { type: String, default: '' },
        status: { type: String, default: 'NOT_CONFIGURED' },
        lastSyncedAt: { type: Date, default: Date.now },
      },
      payment: {
        enabled: { type: Boolean, default: false },
        provider: { type: String, default: 'Razorpay' },
        keyId: { type: String, default: '' },
        keySecret: { type: String, default: '' },
        webhookSecret: { type: String, default: '' },
        liveMode: { type: Boolean, default: false },
        status: { type: String, default: 'NOT_CONFIGURED' },
        lastSyncedAt: { type: Date, default: Date.now },
      },
      webhooks: {
        enabled: { type: Boolean, default: false },
        url: { type: String, default: '' },
        secret: { type: String, default: '' },
        status: { type: String, default: 'NOT_CONFIGURED' },
      },
    },
  },
  {
    timestamps: true,
  }
);

// Enforce uniqueness only for tenants that actually set a custom domain.
// Default is null, so the partial filter keeps unconfigured tenants out of the index.
tenantSchema.index(
  { customDomain: 1 },
  { unique: true, partialFilterExpression: { customDomain: { $type: 'string' } } }
);

module.exports = mongoose.model('Tenant', tenantSchema);
