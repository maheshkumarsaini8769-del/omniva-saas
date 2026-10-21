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
const {
  initiateOAuth,
  handleOAuthCallback,
  getIntegrationStatus,
  updatePageSelection,
  manualSync,
  disconnectIntegration,
} = require('../controllers/metaOAuthController');
const { protect, authorize, tenantScope } = require('../middlewares/authMiddleware');
const moduleGate = require('../middlewares/moduleGate');
const { OWNER_ROLES, MARKETING_ROLES, ANALYTICS_ROLES } = require('../config/merchantRoles');

// Public Meta Webhook endpoints (for Meta Graph API callbacks)
router.get('/webhooks/meta', verifyWebhook);
router.post('/webhooks/meta', handleMetaWebhook);

// Public Meta OAuth Redirect Callback
router.get('/meta/oauth/callback', handleOAuthCallback);

// Protected Merchant Meta Lead Ads OAuth & Sync Endpoints
router.get('/meta/oauth/url', protect, authorize(...MARKETING_ROLES), tenantScope, moduleGate('marketingAds'), initiateOAuth);
router.get('/meta/integration', protect, authorize(...MARKETING_ROLES), tenantScope, moduleGate('marketingAds'), getIntegrationStatus);
router.patch('/meta/integration/pages', protect, authorize(...MARKETING_ROLES), tenantScope, moduleGate('marketingAds'), updatePageSelection);
router.post('/meta/integration/sync', protect, authorize(...MARKETING_ROLES), tenantScope, moduleGate('marketingAds'), manualSync);
router.post('/meta/integration/disconnect', protect, authorize(...OWNER_ROLES), tenantScope, moduleGate('marketingAds'), disconnectIntegration);

// Protected Merchant Meta Tracking configuration endpoints (CAPI / Pixel)
router.get('/meta/settings', protect, authorize(...MARKETING_ROLES), tenantScope, moduleGate('marketingAds'), getMetaSettings);
router.put('/meta/settings', protect, authorize(...MARKETING_ROLES), tenantScope, moduleGate('marketingAds'), updateMetaSettings);
router.post('/meta/test-capi', protect, authorize(...MARKETING_ROLES), tenantScope, moduleGate('marketingAds'), testCapiDispatch);
router.get('/meta/analytics', protect, authorize(...ANALYTICS_ROLES), tenantScope, moduleGate('marketingAds'), getAttributionAnalytics);

module.exports = router;
