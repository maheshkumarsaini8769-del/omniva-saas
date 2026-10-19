const express = require('express');
const router = express.Router();
const { protect, authorize, tenantScope } = require('../middlewares/authMiddleware');
const {
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
} = require('../controllers/couponController');

const allowedMerchantRoles = [
  'SUPER_ADMIN',
  'SUPER_STAFF',
  'MERCHANT_OWNER',
  'ORDER_MANAGER',
  'MARKETING_STAFF',
];

const managerRoles = [
  'SUPER_ADMIN',
  'SUPER_STAFF',
  'MERCHANT_OWNER',
  'MARKETING_STAFF',
];

router
  .route('/')
  .get(protect, authorize(...allowedMerchantRoles), tenantScope, getCoupons)
  .post(protect, authorize(...managerRoles), tenantScope, createCoupon);

router
  .route('/:id')
  .put(protect, authorize(...managerRoles), tenantScope, updateCoupon)
  .delete(protect, authorize(...managerRoles), tenantScope, deleteCoupon);

module.exports = router;
