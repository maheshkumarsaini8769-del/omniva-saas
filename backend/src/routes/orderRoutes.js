const express = require('express');
const router = express.Router();
const { protect, authorize, tenantScope } = require('../middlewares/authMiddleware');
const moduleGate = require('../middlewares/moduleGate');
const {
  getOrders,
  getOrderById,
  updateOrderStatus,
  getOrderStats,
  getAiOrderInsights,
  getExecutiveOverview,
} = require('../controllers/orderController');

const {
  ALL_MERCHANT_ROLES,
  ORDER_WRITE_ROLES,
  ANALYTICS_ROLES,
} = require('../config/merchantRoles');

router.use(protect);
router.use(authorize(...ALL_MERCHANT_ROLES));
router.use(tenantScope);
router.use(moduleGate('products'));

router.get('/executive-overview', authorize(...ANALYTICS_ROLES), getExecutiveOverview);
router.get('/stats', authorize(...ANALYTICS_ROLES), getOrderStats);
router.get('/ai-insights', authorize(...ANALYTICS_ROLES), getAiOrderInsights);
router.get('/', getOrders);
router.get('/:id', getOrderById);
router.patch('/:id/status', authorize(...ORDER_WRITE_ROLES), updateOrderStatus);

module.exports = router;
