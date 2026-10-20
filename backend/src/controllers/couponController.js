const mongoose = require('mongoose');
const Coupon = require('../models/Coupon');
const Tenant = require('../models/Tenant');

// @desc    Get all coupons for merchant
// @route   GET /api/coupons
// @access  Private (Merchant Admin)
const getCoupons = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json({ success: true, data: [] });
    }

    const coupons = await Coupon.find({ businessId: req.businessId }).sort({ createdAt: -1 });
    res.json({ success: true, data: coupons });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a new coupon
// @route   POST /api/coupons
// @access  Private (Merchant Admin)
const createCoupon = async (req, res) => {
  try {
    const {
      code,
      title,
      description,
      discountType,
      discountValue,
      minOrderValue,
      maxDiscount,
      isActive,
      expiresAt,
      usageLimit,
    } = req.body;

    if (!code || !discountValue) {
      return res.status(400).json({ success: false, message: 'Coupon code and discount value are required' });
    }

    const cleanCode = code.trim().toUpperCase();

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Coupon service is temporarily unavailable. Please try again.',
      });
    }

    const existing = await Coupon.findOne({ businessId: req.businessId, code: cleanCode });
    if (existing) {
      return res.status(400).json({ success: false, message: `Coupon with code "${cleanCode}" already exists` });
    }

    const coupon = await Coupon.create({
      businessId: req.businessId,
      code: cleanCode,
      title: title || `${cleanCode} Offer`,
      description: description || '',
      discountType: discountType || 'PERCENTAGE',
      discountValue: Number(discountValue),
      minOrderValue: Number(minOrderValue) || 0,
      maxDiscount: Number(maxDiscount) || 0,
      isActive: isActive !== false,
      expiresAt: expiresAt || null,
      usageLimit: Number(usageLimit) || 0,
    });

    res.status(201).json({ success: true, data: coupon });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update / toggle coupon
// @route   PUT /api/coupons/:id
// @access  Private (Merchant Admin)
const updateCoupon = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Coupon service is temporarily unavailable. Please try again.',
      });
    }

    const coupon = await Coupon.findOne({ _id: req.params.id, businessId: req.businessId });
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }

    const fields = [
      'title',
      'description',
      'discountType',
      'discountValue',
      'minOrderValue',
      'maxDiscount',
      'isActive',
      'expiresAt',
      'usageLimit',
    ];

    fields.forEach((f) => {
      if (req.body[f] !== undefined) {
        coupon[f] = req.body[f];
      }
    });

    if (req.body.code) {
      coupon.code = req.body.code.trim().toUpperCase();
    }

    await coupon.save();
    res.json({ success: true, data: coupon });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete coupon
// @route   DELETE /api/coupons/:id
// @access  Private (Merchant Admin)
const deleteCoupon = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Coupon service is temporarily unavailable. Please try again.',
      });
    }

    const coupon = await Coupon.findOneAndDelete({ _id: req.params.id, businessId: req.businessId });
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }

    res.json({ success: true, message: 'Coupon deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get active public coupons for a storefront
// @route   GET /api/public/store/:slug/coupons
// @access  Public
const getPublicCoupons = async (req, res) => {
  try {
    const { slug } = req.params;

    if (mongoose.connection.readyState !== 1) {
      return res.json({ success: true, data: [] });
    }

    const tenant = await Tenant.findOne({ slug, status: 'ACTIVE' }).select('_id');
    if (!tenant) {
      return res.json({ success: true, data: [] });
    }

    const coupons = await Coupon.find({
      businessId: tenant._id,
      isActive: true,
      $or: [{ expiresAt: null }, { expiresAt: { $gte: new Date() } }],
    }).select('code title description discountType discountValue minOrderValue maxDiscount expiresAt usageCount usageLimit');

    const availableCoupons = coupons.filter(
      (coupon) => !coupon.usageLimit || coupon.usageCount < coupon.usageLimit
    );

    res.json({
      success: true,
      data: availableCoupons,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Validate a coupon code against cart amount
// @route   POST /api/public/store/:slug/coupons/validate
// @access  Public
const validateCoupon = async (req, res) => {
  try {
    const { slug } = req.params;
    const { code, cartSubtotal, subtotal, amount } = req.body;

    if (!code || !code.trim()) {
      return res.status(400).json({ success: false, message: 'Coupon code is required' });
    }

    const cleanCode = code.trim().toUpperCase();
    let coupon = null;

    if (mongoose.connection.readyState === 1) {
      const tenant = await Tenant.findOne({ slug, status: 'ACTIVE' }).select('_id');
      if (tenant) {
        coupon = await Coupon.findOne({
          businessId: tenant._id,
          code: cleanCode,
          isActive: true,
        });
      }
    }

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: `Coupon code "${cleanCode}" is invalid or expired`,
      });
    }

    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return res.status(400).json({
        success: false,
        message: `Coupon "${cleanCode}" has expired`,
      });
    }

    if (coupon.usageLimit > 0 && coupon.usageCount >= coupon.usageLimit) {
      return res.status(400).json({
        success: false,
        message: `Coupon "${cleanCode}" has reached its usage limit`,
      });
    }

    const finalSubtotal = Number(cartSubtotal ?? subtotal ?? amount) || 0;
    if (coupon.minOrderValue > 0 && finalSubtotal < coupon.minOrderValue) {
      return res.status(400).json({
        success: false,
        message: `Minimum order amount of ₹${coupon.minOrderValue} is required to apply "${cleanCode}". Add ₹${coupon.minOrderValue - finalSubtotal} more!`,
      });
    }

    let discountAmount = 0;
    if (coupon.discountType === 'PERCENTAGE') {
      discountAmount = Math.round((finalSubtotal * Number(coupon.discountValue)) / 100);
      if (coupon.maxDiscount > 0 && discountAmount > coupon.maxDiscount) {
        discountAmount = coupon.maxDiscount;
      }
    } else {
      discountAmount = Math.min(Number(coupon.discountValue) || 0, finalSubtotal);
    }

    res.json({
      success: true,
      message: `Coupon "${cleanCode}" applied successfully! You saved ₹${discountAmount}.`,
      data: {
        code: coupon.code,
        title: coupon.title || coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmount,
        minOrderValue: coupon.minOrderValue,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  getPublicCoupons,
  validateCoupon,
};
