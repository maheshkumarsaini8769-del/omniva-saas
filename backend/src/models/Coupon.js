const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: [true, 'Tenant business ID is required'],
      index: true,
    },
    code: {
      type: String,
      required: [true, 'Coupon code is required'],
      trim: true,
      uppercase: true,
    },
    title: {
      type: String,
      default: '',
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    discountType: {
      type: String,
      enum: ['PERCENTAGE', 'FLAT'],
      default: 'PERCENTAGE',
    },
    discountValue: {
      type: Number,
      required: [true, 'Discount value is required'],
      min: 1,
    },
    minOrderValue: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxDiscount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    usageCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    usageLimit: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

couponSchema.index({ businessId: 1, code: 1 }, { unique: true });

module.exports = mongoose.model('Coupon', couponSchema);
