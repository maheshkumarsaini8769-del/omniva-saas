const Product = require('../models/Product');
const Category = require('../models/Category');
const { normalizeProductImages, getImageStorageKeys } = require('../utils/productImages');
const { deleteImage } = require('../services/storageService');

const mongoose = require('mongoose');

// Escape regex metacharacters in user-supplied names before building a RegExp.
const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// ==================== CATEGORIES ====================

// @desc    Get all categories for merchant
// @route   GET /api/categories
// @access  Private (Merchant Admin/Staff)
const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({ businessId: req.businessId }).sort({ orderIndex: 1, name: 1 });
    res.json({ success: true, count: categories.length, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a category
// @route   POST /api/categories
// @access  Private (Merchant Admin)
const createCategory = async (req, res) => {
  try {
    const { name, slug, description, image, orderIndex } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Category name is required' });
    }

    const trimmedName = name.trim();
    let catSlug = slug?.trim() || trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    // Check if category with this name or slug already exists for this merchant
    const existing = await Category.findOne({
      businessId: req.businessId,
      $or: [
        { name: { $regex: new RegExp(`^${escapeRegex(trimmedName)}$`, 'i') } },
        { slug: catSlug }
      ]
    });

    if (existing) {
      // If image or description provided, update existing
      if (image && !existing.image) existing.image = image;
      if (description && !existing.description) existing.description = description;
      await existing.save();
      return res.status(200).json({ success: true, data: existing, message: 'Category ready' });
    }

    const category = await Category.create({
      businessId: req.businessId,
      name: trimmedName,
      slug: catSlug,
      description: description || '',
      image: image || '',
      orderIndex: orderIndex || 0,
      isActive: true,
    });

    res.status(201).json({ success: true, data: category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a category
// @route   PUT /api/categories/:id
// @access  Private (Merchant Admin)
const updateCategory = async (req, res) => {
  try {
    const category = await Category.findOne({ _id: req.params.id, businessId: req.businessId });
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const { name, slug, description, image, orderIndex, isActive } = req.body;
    if (name) category.name = name.trim();
    if (slug) category.slug = slug.trim();
    if (description !== undefined) category.description = description;
    if (image !== undefined) category.image = image;
    if (orderIndex !== undefined) category.orderIndex = orderIndex;
    if (isActive !== undefined) category.isActive = isActive;

    await category.save();
    res.json({ success: true, data: category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a category
// @route   DELETE /api/categories/:id
// @access  Private (Merchant Admin)
const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findOneAndDelete({ _id: req.params.id, businessId: req.businessId });
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    res.json({ success: true, message: 'Category deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== PRODUCTS ====================

// @desc    Get all products for merchant
// @route   GET /api/products
// @access  Private (Merchant Admin/Staff)
const getProducts = async (req, res) => {
  try {
    const { categoryId, search, isAvailable } = req.query;
    const filter = { businessId: req.businessId };

    if (categoryId) filter.categoryId = categoryId;
    if (isAvailable !== undefined) filter.isAvailable = isAvailable === 'true';
    if (search) {
      const safeSearch = String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { name: { $regex: safeSearch, $options: 'i' } },
        { description: { $regex: safeSearch, $options: 'i' } },
        { tags: { $in: [new RegExp(safeSearch, 'i')] } },
      ];
    }

    const products = await Product.find(filter)
      .populate('categoryId', 'name slug image')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: products.length, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Private (Merchant Admin/Staff)
const getProductById = async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, businessId: req.businessId }).populate('categoryId', 'name slug image');
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create product
// @route   POST /api/products
// @access  Private (Merchant Admin)
const createProduct = async (req, res) => {
  try {
    const { name, slug, categoryId, categoryName, description, price, compareAtPrice, images, variants, stockQuantity, trackQuantity, isAvailable, tags } = req.body;

    if (!name || price === undefined) {
      return res.status(400).json({ success: false, message: 'Product name and price are required' });
    }

    let prodSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const existing = await Product.findOne({ businessId: req.businessId, slug: prodSlug });
    if (existing) {
      prodSlug = `${prodSlug}-${Date.now().toString().slice(-4)}`;
    }

    // Resolve categoryId if categoryId or categoryName provided
    let resolvedCategoryId = null;
    if (categoryId && mongoose.Types.ObjectId.isValid(categoryId)) {
      resolvedCategoryId = categoryId;
    } else if (categoryName || categoryId) {
      const searchCat = (categoryName || categoryId).toString().trim();
      const catObj = await Category.findOne({
        businessId: req.businessId,
        $or: [
          { name: { $regex: new RegExp(`^${escapeRegex(searchCat)}$`, 'i') } },
          { slug: searchCat.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') }
        ]
      });
      if (catObj) {
        resolvedCategoryId = catObj._id;
      }
    }

    const product = await Product.create({
      businessId: req.businessId,
      categoryId: resolvedCategoryId,
      name: name.trim(),
      slug: prodSlug,
      description: description || '',
      price: Number(price),
      compareAtPrice: Number(compareAtPrice || 0),
      images: normalizeProductImages(Array.isArray(images) ? images : (images ? [images] : [])),
      variants: Array.isArray(variants) ? variants : [],
      stockQuantity: stockQuantity !== undefined ? Number(stockQuantity) : 100,
      trackQuantity: trackQuantity !== undefined ? Boolean(trackQuantity) : true,
      isAvailable: isAvailable !== undefined ? Boolean(isAvailable) : true,
      tags: Array.isArray(tags) ? tags : [],
    });

    const populatedProduct = await Product.findById(product._id).populate('categoryId', 'name slug image');
    res.status(201).json({ success: true, data: populatedProduct });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private (Merchant Admin)
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, businessId: req.businessId });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const fields = ['name', 'slug', 'description', 'price', 'compareAtPrice', 'images', 'variants', 'stockQuantity', 'trackQuantity', 'isAvailable', 'tags'];
    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        product[field] = req.body[field];
      }
    });

    // Resolve categoryId if provided
    if (req.body.categoryId && mongoose.Types.ObjectId.isValid(req.body.categoryId)) {
      product.categoryId = req.body.categoryId;
    } else if (req.body.categoryName || (req.body.categoryId && !mongoose.Types.ObjectId.isValid(req.body.categoryId))) {
      const searchCat = (req.body.categoryName || req.body.categoryId).toString().trim();
      const catObj = await Category.findOne({
        businessId: req.businessId,
        $or: [
          { name: { $regex: new RegExp(`^${escapeRegex(searchCat)}$`, 'i') } },
          { slug: searchCat.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') }
        ]
      });
      if (catObj) {
        product.categoryId = catObj._id;
      }
    }

    await product.save();
    const populated = await Product.findById(product._id).populate('categoryId', 'name slug image');
    res.json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private (Merchant Admin)
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findOneAndDelete({ _id: req.params.id, businessId: req.businessId });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Remove the stored image objects for this product. A storage failure must
    // not block the product deletion, so it is logged and ignored.
    const storageKeys = getImageStorageKeys(product.images);
    if (storageKeys.length > 0) {
      Promise.all(
        storageKeys.map((key) =>
          deleteImage(key).catch((storageError) => {
            console.warn('[Product Delete] Image cleanup failed:', storageError.message);
          })
        )
      ).catch(() => {});
    }

    res.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Apply bulk discount across all products or a specific category
// @route   POST /api/products/bulk-discount
// @access  Private (Merchant Admin)
const applyBulkDiscount = async (req, res) => {
  try {
    const {
      discountPercent,
      categoryId = null,
      categoryName = null,
      applyToAll = true,
    } = req.body;
    const pct = Number(discountPercent);
    if (!Number.isFinite(pct) || pct < 1 || pct > 90) {
      return res.status(400).json({
        success: false,
        message: 'Discount percentage must be a number between 1 and 90',
      });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Product service is temporarily unavailable. Please try again.',
      });
    }

    let resolvedCategoryId = categoryId;
    if (!applyToAll) {
      if (!resolvedCategoryId && categoryName) {
        const category = await Category.findOne({
          businessId: req.businessId,
          name: categoryName,
        }).select('_id');
        resolvedCategoryId = category?._id || null;
      }
      if (!resolvedCategoryId) {
        return res.status(400).json({
          success: false,
          message: 'A valid category is required when applying a category-scoped discount',
        });
      }
    }

    const query = { businessId: req.businessId };
    if (!applyToAll) {
      query.categoryId = resolvedCategoryId;
    }

    const products = await Product.find(query);
    let updatedCount = 0;

    for (const p of products) {
      const origCompare = p.compareAtPrice > 0 ? p.compareAtPrice : p.price;
      const newPrice = Math.max(1, Math.round(origCompare * (1 - pct / 100)));
      p.compareAtPrice = origCompare;
      p.price = newPrice;

      if (p.variants && p.variants.length > 0) {
        p.variants.forEach((v) => {
          const vOrig = v.compareAtPrice > 0 ? v.compareAtPrice : v.price;
          v.compareAtPrice = vOrig;
          v.price = Math.max(1, Math.round(vOrig * (1 - pct / 100)));
        });
      }

      await p.save();
      updatedCount++;
    }

    res.json({
      success: true,
      message: `Successfully applied ${pct}% discount across ${updatedCount} products!`,
      data: { discountPercent: pct, affectedCount: updatedCount },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  applyBulkDiscount,
};
