const express = require('express');
const router = express.Router();
const {
  getPublicStore,
  getPublicProduct,
  createPublicOrder,
  trackPublicOrder,
  createPublicInquiry,
} = require('../controllers/publicStoreController');
const { createPublicBooking } = require('../controllers/bookingController');
const { getPublicCoupons, validateCoupon } = require('../controllers/couponController');
const { enforceQuota } = require('../middlewares/quotaMiddleware');
const { checkoutRateLimiter } = require('../middlewares/rateLimitMiddleware');

router.get('/store/:slug', getPublicStore);
router.get('/store/:slug/coupons', getPublicCoupons);
router.post('/store/:slug/coupons/validate', validateCoupon);
router.get('/store/:slug/product/:productSlug', getPublicProduct);
router.post('/store/:slug/orders', checkoutRateLimiter.middleware(), enforceQuota('orders'), createPublicOrder);
router.post('/store/:slug/inquire', checkoutRateLimiter.middleware(), createPublicInquiry);
router.post('/store/:slug/book', checkoutRateLimiter.middleware(), createPublicBooking);
router.get('/orders/track', trackPublicOrder);

module.exports = router;
