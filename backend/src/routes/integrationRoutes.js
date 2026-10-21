const express = require('express');
const router = express.Router();
const {
  getIntegrations,
  updateIntegrations,
  testIntegration,
} = require('../controllers/integrationController');
const { protect, authorize, tenantScope } = require('../middlewares/authMiddleware');
const { OWNER_ROLES } = require('../config/merchantRoles');

// Payment keys, WhatsApp tokens, and courier credentials are owner-only.
router.use(protect);
router.use(authorize(...OWNER_ROLES));
router.use(tenantScope);

router.route('/')
  .get(getIntegrations)
  .put(updateIntegrations);

router.post('/test', testIntegration);

module.exports = router;
