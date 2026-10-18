const express = require('express');
const router = express.Router();
const {
  verifyWebhook,
  handleMetaWebhook,
} = require('../controllers/metaWebhookController');
const {
  getMetaSettings,
  updateMetaSettings,
  testCapiDispatch,
  getAttributionAnalytics,
} = require('../controllers/metaController');
const { protect, tenantScope } = require('../middlewares/authMiddleware');
const moduleGate = require('../middlewares/moduleGate');

// Public Meta Webhook endpoints (for Meta Graph API callbacks)
router.get('/webhooks/meta', verifyWebhook);
router.post('/webhooks/meta', handleMetaWebhook);

// Protected Merchant Meta Tracking configuration endpoints
router.get('/meta/settings', protect, tenantScope, moduleGate('marketingAds'), getMetaSettings);
router.put('/meta/settings', protect, tenantScope, moduleGate('marketingAds'), updateMetaSettings);
router.post('/meta/test-capi', protect, tenantScope, moduleGate('marketingAds'), testCapiDispatch);
router.get('/meta/analytics', protect, tenantScope, moduleGate('marketingAds'), getAttributionAnalytics);

module.exports = router;
