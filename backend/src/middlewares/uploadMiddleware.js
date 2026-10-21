// backend/src/middlewares/uploadMiddleware.js
// Multipart upload handling for merchant media.
// - images are buffered in memory (never written to disk unprocessed)
// - only a small MIME whitelist is accepted
// - the file size is capped
// - a per-tenant hourly quota stops storage abuse

const multer = require('multer');

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const DEFAULT_UPLOADS_PER_HOUR = 20;

/**
 * Multer middleware for a single product image.
 */
const createImageUpload = ({ maxBytes = MAX_IMAGE_BYTES } = {}) =>
  multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: maxBytes,
      files: 1,
      fields: 10,
    },
    fileFilter: (req, file, cb) => {
      if (!ALLOWED_IMAGE_TYPES.includes(String(file.mimetype || '').toLowerCase())) {
        const error = new Error(
          `Unsupported image type. Allowed types: ${ALLOWED_IMAGE_TYPES.join(', ')}`
        );
        error.statusCode = 400;
        error.code = 'UNSUPPORTED_MEDIA_TYPE';
        return cb(error);
      }
      return cb(null, true);
    },
  });

/**
 * Translate multer errors into clean API responses.
 */
const handleUploadError = (error, req, res, next) => {
  if (!error) return next();

  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      code: 'FILE_TOO_LARGE',
      message: `Image is too large. Maximum size is ${Math.round(
        MAX_IMAGE_BYTES / (1024 * 1024)
      )}MB.`,
    });
  }

  if (error.code === 'LIMIT_UNEXPECTED_FILE' || error.code === 'UNSUPPORTED_MEDIA_TYPE') {
    return res.status(400).json({
      success: false,
      code: error.code || 'INVALID_UPLOAD',
      message:
        error.message ||
        'Invalid upload. Send one image file in the "image" field as jpeg, png or webp.',
    });
  }

  if (error.statusCode) {
    return res.status(error.statusCode).json({
      success: false,
      code: error.code || 'INVALID_UPLOAD',
      message: error.message,
    });
  }

  return next(error);
};

/**
 * Per-tenant hourly upload quota. The counter lives in process memory, which
 * is enough for a cost guard: losing it on a restart only resets the budget.
 */
const createTenantUploadLimiter = ({
  maxPerHour = DEFAULT_UPLOADS_PER_HOUR,
  windowMs = 60 * 60 * 1000,
} = {}) => {
  const hits = new Map();

  const sweep = () => {
    const now = Date.now();
    for (const [key, record] of hits.entries()) {
      if (now - record.startedAt > windowMs) hits.delete(key);
    }
  };
  const sweepTimer = setInterval(sweep, 5 * 60 * 1000);
  if (typeof sweepTimer.unref === 'function') sweepTimer.unref();

  return (req, res, next) => {
    const tenantKey = String(req.businessId || req.user?.businessId || 'unknown');
    const now = Date.now();

    let record = hits.get(tenantKey);
    if (!record || now - record.startedAt > windowMs) {
      record = { startedAt: now, count: 0 };
      hits.set(tenantKey, record);
    }
    record.count += 1;

    if (record.count > maxPerHour) {
      const retryAfterMs = windowMs - (now - record.startedAt);
      res.setHeader('Retry-After', Math.ceil(retryAfterMs / 1000));
      return res.status(429).json({
        success: false,
        code: 'UPLOAD_QUOTA_EXCEEDED',
        message: `Upload limit reached. You can upload ${maxPerHour} images per hour.`,
        retryAfterMs,
      });
    }

    return next();
  };
};

module.exports = {
  ALLOWED_IMAGE_TYPES,
  DEFAULT_UPLOADS_PER_HOUR,
  MAX_IMAGE_BYTES,
  createImageUpload,
  createTenantUploadLimiter,
  handleUploadError,
};
