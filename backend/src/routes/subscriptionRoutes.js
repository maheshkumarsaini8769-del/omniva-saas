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
// Plan changes affect billing and reset-sensitive quota windows. Only the
// merchant owner (or platform admin) may make them, never ordinary staff.
router.post(
  '/upgrade',
  authorize('SUPER_ADMIN', 'SUPER_STAFF', 'MERCHANT_OWNER'),
  upgradePlan
);
router.get('/analytics', getFinancialAnalytics);

module.exports = router;
