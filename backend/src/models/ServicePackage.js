const mongoose = require('mongoose');

const servicePackageSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: [true, 'Tenant business ID is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Package title is required'],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, 'Package slug is required'],
      trim: true,
      lowercase: true,
    },
    category: {
      type: String,
      default: '',
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    duration: {
      type: String,
      default: '', // e.g. "4 Hours", "Full Day", "3 Days / 2 Nights"
    },
    price: {
      type: Number,
      required: [true, 'Package price is required'],
      min: 0,
    },
    advanceTokenPercent: {
      type: Number,
      default: 0, // No advance unless the merchant configures one
      min: 0,
      max: 100,
    },
    deliverables: {
      type: [String],
      default: [],
    },
    images: {
      type: [String],
      default: [],
    },
    isAvailable: {
      type: Boolean,
      default: true,
      index: true,
    },
    maxCapacityPerDay: {
      type: Number,
      default: 1, // e.g. max 1 shoot or max 20 tour passengers per day
    },
  },
  {
    timestamps: true,
  }
);

servicePackageSchema.index({ businessId: 1, slug: 1 }, { unique: true });

module.exports = mongoose.model('ServicePackage', servicePackageSchema);
