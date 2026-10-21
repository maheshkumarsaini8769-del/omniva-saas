const express = require('express');
const router = express.Router();
const { protect, authorize, tenantScope } = require('../middlewares/authMiddleware');
const {
  getPlans,
  getSubscriptionUsage,
  upgradePlan,
  getFinancialAnalytics,
} = require('../controllers/subscriptionController');

const allowedMerchantRoles = [
  'SUPER_ADMIN',
  'SUPER_STAFF',
  'MERCHANT_OWNER',
  'ORDER_MANAGER',
  'INVENTORY_STAFF',
  'MARKETING_STAFF',
];

// Public plan directory
router.get('/plans', getPlans);

// Protected routes
router.use(protect);
router.use(authorize(...allowedMerchantRoles));
router.use(tenantScope);

router.get('/usage', getSubscriptionUsage);
// Merchant self-service upgrades are disabled until subscription billing is
// integrated. Plan changes require platform admin approval.
router.post(
  '/upgrade',
  authorize('SUPER_ADMIN', 'SUPER_STAFF'),
  upgradePlan
);
router.get('/analytics', getFinancialAnalytics);

module.exports = router;
