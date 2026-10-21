const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    variantId: {
      type: String,
      default: null,
    },
    name: {
      type: String,
      required: true,
    },
    variantName: {
      type: String,
      default: '',
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    image: {
      type: String,
      default: '',
    },
  },
  { _id: true }
);

const orderTimelineSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      required: true,
    },
    note: {
      type: String,
      default: '',
    },
    updatedBy: {
      type: String,
      default: 'System',
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: [true, 'Tenant business ID is required'],
      index: true,
    },
    orderNumber: {
      type: String,
      required: true,
      index: true,
    },
    // Client-supplied retry key so a double-click or network retry cannot create
    // two orders (and decrement stock twice) for one checkout attempt.
    idempotencyKey: {
      type: String,
      default: undefined,
      trim: true,
      maxlength: 128,
    },
    // Set when this order actually decremented tracked inventory. Cancellation
    // only restores stock for orders that took it.
    stockDecremented: {
      type: Boolean,
      default: false,
    },
    stockRestored: {
      type: Boolean,
      default: false,
    },
    customerName: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
    },
    customerPhone: {
      type: String,
      required: [true, 'Customer phone is required'],
      trim: true,
      index: true,
    },
    customerEmail: {
      type: String,
      default: '',
      trim: true,
      lowercase: true,
    },
    shippingAddress: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, default: '' },
      pincode: { type: String, required: true },
      landmark: { type: String, default: '' },
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: [val => val.length > 0, 'Order must contain at least one item'],
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    shippingFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    couponCode: {
      type: String,
      default: '',
      trim: true,
      uppercase: true,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: ['COD', 'ONLINE'],
      required: [true, 'Payment method is required'],
    },
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'],
      default: 'PENDING',
      index: true,
    },
    paymentDetails: {
      transactionId: { type: String, default: '' },
      razorpayOrderId: { type: String, default: '' },
      razorpayPaymentId: { type: String, default: '' },
      paymentProof: { type: String, default: '' },
    },
    orderStatus: {
      type: String,
      enum: ['NEW', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'],
      default: 'NEW',
      index: true,
    },
    courierPartner: {
      type: String,
      default: '',
    },
    trackingNumber: {
      type: String,
      default: '',
    },
    attribution: {
      utmSource: { type: String, default: '' },
      utmMedium: { type: String, default: '' },
      utmCampaign: { type: String, default: '' },
      utmContent: { type: String, default: '' },
      fbclid: { type: String, default: '' },
      fbp: { type: String, default: '' },
      fbc: { type: String, default: '' },
      referrer: { type: String, default: '' },
      clientIp: { type: String, default: '' },
      userAgent: { type: String, default: '' },
    },
    notes: {
      type: String,
      default: '',
    },
    duplicateResolved: {
      type: Boolean,
      default: false,
      index: true,
    },
    timeline: {
      type: [orderTimelineSchema],
      default: () => [{
        status: 'NEW',
        note: 'Order placed by customer',
        updatedBy: 'Customer',
        timestamp: new Date(),
      }],
    },
  },
  {
    timestamps: true,
  }
);

orderSchema.index({ businessId: 1, orderNumber: 1 }, { unique: true });
orderSchema.index({ businessId: 1, orderStatus: 1, createdAt: -1 });
orderSchema.index(
  { businessId: 1, idempotencyKey: 1 },
  { unique: true, partialFilterExpression: { idempotencyKey: { $type: 'string' } } }
);

module.exports = mongoose.model('Order', orderSchema);
