// backend/src/controllers/uploadController.js
// Product image upload: one endpoint that turns a merchant's photo into the
// three sizes the storefront needs (thumb / card / full) and stores them in
// Cloudflare R2 (or the local disk driver in development).

const crypto = require('crypto');
const sharp = require('sharp');

const {
  buildObjectKey,
  deleteImage,
  getStorageStatus,
  uploadImage,
} = require('../services/storageService');

const IMAGE_SIZES = [
  { variant: 'thumb', size: 200 },
  { variant: 'card', size: 600 },
  { variant: 'full', size: 1200 },
];

const EXTENSION_BY_MIME = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

const buildBaseName = () => `p-${crypto.randomBytes(10).toString('hex')}`;

/**
 * @desc    Upload a product image and return the generated size variants
 * @route   POST /api/upload/product-image
 * @access  Private (MERCHANT_OWNER, INVENTORY_STAFF)
 */
const uploadProductImage = async (req, res) => {
  try {
    if (!req.file || !req.file.buffer || !req.file.buffer.length) {
      return res.status(400).json({
        success: false,
        code: 'NO_FILE',
        message: 'Attach one image in the "image" field.',
      });
    }

    const businessId = String(req.businessId || req.user?.businessId || '');
    if (!businessId) {
      return res.status(400).json({ success: false, message: 'Tenant context is required' });
    }

    const mimeType = String(req.file.mimetype || '').toLowerCase();
    const extension = EXTENSION_BY_MIME[mimeType];
    if (!extension) {
      return res.status(400).json({
        success: false,
        code: 'UNSUPPORTED_MEDIA_TYPE',
        message: 'Only jpeg, png and webp images are supported.',
      });
    }

    // sharp throws on a corrupt file, so the real image check happens here.
    let metadata;
    try {
      metadata = await sharp(req.file.buffer).metadata();
    } catch (error) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_IMAGE',
        message: 'That file is not a readable image. Please re-export it as jpeg, png or webp.',
      });
    }

    if (!metadata || !metadata.width || !metadata.height) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_IMAGE',
        message: 'That file is not a readable image.',
      });
    }

    const baseName = buildBaseName();
    const variants = {};

    for (const { variant, size } of IMAGE_SIZES) {
      // rotate() applies the EXIF orientation, and no metadata is copied, so
      // GPS coordinates and camera data never leave the merchant's device.
      const processed = await sharp(req.file.buffer)
        .rotate()
        .resize(size, size, { fit: 'cover', position: 'centre' })
        .webp({ quality: 82 })
        .toBuffer();

      const key = buildObjectKey({
        businessId,
        folder: 'products',
        baseName,
        variant,
        extension: 'webp',
      });
      const stored = await uploadImage({
        buffer: processed,
        key,
        contentType: 'image/webp',
      });
      variants[variant] = { key: stored.key, url: stored.url, size: stored.size };
    }

    // Keep the untouched original so the merchant can download it later.
    const originalKey = buildObjectKey({
      businessId,
      folder: 'products',
      baseName,
      variant: 'original',
      extension,
    });
    const original = await uploadImage({
      buffer: req.file.buffer,
      key: originalKey,
      contentType: mimeType,
      cacheControl: 'public, max-age=86400',
    });
    variants.original = { key: original.key, url: original.url, size: original.size };

    return res.status(201).json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        ...variants,
        originalWidth: metadata.width,
        originalHeight: metadata.height,
        storage: getStorageStatus().driver,
      },
    });
  } catch (error) {
    console.error('[Upload Controller] Product image upload failed:', error.message);
    return res.status(500).json({
      success: false,
      code: 'UPLOAD_FAILED',
      message: 'The image could not be stored. Please try again.',
    });
  }
};

/**
 * @desc    Remove an uploaded image that was not attached to a product yet
 * @route   DELETE /api/upload/product-image
 * @access  Private (MERCHANT_OWNER, INVENTORY_STAFF)
 */
const deleteProductImage = async (req, res) => {
  try {
    const businessId = String(req.businessId || req.user?.businessId || '');
    const key = String(req.body?.key || req.query?.key || '').trim();

    if (!key) {
      return res.status(400).json({ success: false, message: 'A storage key is required' });
    }

    // A tenant may only delete objects inside its own namespace.
    if (!key.startsWith(`products/${businessId}/`)) {
      return res.status(403).json({
        success: false,
        message: 'This image does not belong to your business',
      });
    }

    const result = await deleteImage(key);
    return res.json({ success: true, data: result });
  } catch (error) {
    console.error('[Upload Controller] Image delete failed:', error.message);
    return res.status(500).json({
      success: false,
      message: 'The image could not be removed.',
    });
  }
};

module.exports = {
  IMAGE_SIZES,
  deleteProductImage,
  uploadProductImage,
};
