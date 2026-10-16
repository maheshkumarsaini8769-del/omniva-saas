const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/authMiddleware');
const {
  getAllMerchants,
  createMerchant,
  updateMerchantStatus,
  getPlatformStats,
  updateMerchantTemplate,
  updateMerchantModules,
  getMerchantIntegrations,
  updateMerchantIntegrations,
  testMerchantIntegration,
} = require('../controllers/adminController');

router.use(protect);
router.use(authorize('SUPER_ADMIN', 'SUPER_STAFF'));

router.get('/stats', getPlatformStats);
router.get('/merchants', getAllMerchants);
router.post('/merchants', createMerchant);
router.patch('/merchants/:id/status', updateMerchantStatus);
router.patch('/merchants/:id/template', updateMerchantTemplate);
router.patch('/merchants/:id/modules', updateMerchantModules);

// Merchant Integrations & API Keys Management (Super Admin only)
router.get('/merchants/:id/integrations', getMerchantIntegrations);
router.put('/merchants/:id/integrations', updateMerchantIntegrations);
router.post('/merchants/:id/integrations/test', testMerchantIntegration);

module.exports = router;
