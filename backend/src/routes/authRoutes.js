const express = require('express');
const router = express.Router();
const {
  registerMerchant,
  login,
  getMe,
  setupSuperAdmin,
  createStaff,
  getStaffList,
  updateBusinessProfile,
} = require('../controllers/authController');
const {
  protect,
  authorize,
  tenantScope,
} = require('../middlewares/authMiddleware');
const { authRateLimiter } = require('../middlewares/rateLimitMiddleware');

// Public auth routes with brute-force rate limiting
router.post('/register-merchant', authRateLimiter.middleware(), registerMerchant);
router.post('/login', authRateLimiter.middleware(), login);
router.post('/setup-superadmin', setupSuperAdmin);

// Protected routes
router.get('/me', protect, getMe);
router.put('/business-profile', protect, tenantScope, updateBusinessProfile);

// Merchant staff management (Owner only, strictly isolated to req.businessId)
router.post('/staff', protect, authorize('MERCHANT_OWNER'), tenantScope, createStaff);
router.get('/staff', protect, authorize('MERCHANT_OWNER'), tenantScope, getStaffList);

module.exports = router;
