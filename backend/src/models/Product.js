const mongoose = require('mongoose');
const { normalizeProductImages } = require('../utils/productImages');

const variantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    sku: {
      type: String,
      default: '',
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    compareAtPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    costPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    stockQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    attributes: {
      type: Map,
      of: String,
      default: {},
    },
  },
  { _id: true }
);

const productSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: [true, 'Tenant business ID is required'],
      index: true,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, 'Product slug is required'],
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
      default: '',
    },
    price: {
      type: Number,
      required: [true, 'Base product price is required'],
      min: 0,
    },
    compareAtPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    costPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    images: {
      // Each entry is { thumb, card, full, key, alt }. Legacy products store a
      // plain URL string, so the array is mixed and normalised on write.
      type: [mongoose.Schema.Types.Mixed],
      default: [],
      set: (value) => normalizeProductImages(value),
    },
    variants: {
      type: [variantSchema],
      default: [],
    },
    stockQuantity: {
      type: Number,
      default: 100,
      min: 0,
    },
    trackQuantity: {
      type: Boolean,
      default: true,
    },
    isAvailable: {
      type: Boolean,
      default: true,
      index: true,
    },
    tags: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

productSchema.index({ businessId: 1, slug: 1 }, { unique: true });
productSchema.index({ businessId: 1, isAvailable: 1 });

module.exports = mongoose.model('Product', productSchema);
