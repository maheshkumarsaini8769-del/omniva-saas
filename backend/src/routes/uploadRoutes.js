const express = require('express');
const router = express.Router();
const {
  uploadProductImage,
  deleteProductImage,
} = require('../controllers/uploadController');
const { protect, authorize, tenantScope } = require('../middlewares/authMiddleware');
const {
  createImageUpload,
  createTenantUploadLimiter,
  handleUploadError,
  DEFAULT_UPLOADS_PER_HOUR,
} = require('../middlewares/uploadMiddleware');
const { INVENTORY_WRITE_ROLES } = require('../config/merchantRoles');

const imageUpload = createImageUpload();
const configuredQuota = Number(process.env.UPLOAD_MAX_PER_HOUR);
const uploadLimiter = createTenantUploadLimiter({
  maxPerHour:
    Number.isFinite(configuredQuota) && configuredQuota > 0
      ? configuredQuota
      : DEFAULT_UPLOADS_PER_HOUR,
});

// Authentication and the tenant quota run before the file is buffered, so an
// unauthenticated request never reaches the image processor.
router.post(
  '/product-image',
  protect,
  authorize(...INVENTORY_WRITE_ROLES),
  tenantScope,
  uploadLimiter,
  imageUpload.single('image'),
  handleUploadError,
  uploadProductImage
);

router.delete(
  '/product-image',
  protect,
  authorize(...INVENTORY_WRITE_ROLES),
  tenantScope,
  deleteProductImage
);

module.exports = router;
