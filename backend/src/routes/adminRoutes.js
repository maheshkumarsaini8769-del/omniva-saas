const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/authMiddleware');
const {
  getAllMerchants,
  createMerchant,
  updateMerchantStatus,
  updateMerchantProfile,
  getPlatformStats,
  getPlatformPlans,
  updateMerchantTemplate,
  updateMerchantModules,
  getMerchantStaff,
  getMerchantUsage,
  getMerchantIntegrations,
  updateMerchantIntegrations,
  testMerchantIntegration,
} = require('../controllers/adminController');

router.use(protect);
router.use(authorize('SUPER_ADMIN', 'SUPER_STAFF'));

router.get('/stats', getPlatformStats);
router.get('/plans', getPlatformPlans);
router.get('/merchants', getAllMerchants);
router.post('/merchants', createMerchant);
router.patch('/merchants/:id/status', updateMerchantStatus);
router.patch('/merchants/:id', authorize('SUPER_ADMIN'), updateMerchantProfile);
router.patch('/merchants/:id/template', updateMerchantTemplate);
router.patch('/merchants/:id/modules', updateMerchantModules);

// Merchant Integrations & API Keys Management (Super Admin only).
// SUPER_STAFF can operate the platform but must never read merchant secrets.
router.get('/merchants/:id/staff', getMerchantStaff);
router.get('/merchants/:id/usage', getMerchantUsage);
router.get('/merchants/:id/integrations', authorize('SUPER_ADMIN'), getMerchantIntegrations);
router.put('/merchants/:id/integrations', authorize('SUPER_ADMIN'), updateMerchantIntegrations);
router.post('/merchants/:id/integrations/test', authorize('SUPER_ADMIN'), testMerchantIntegration);

module.exports = router;
