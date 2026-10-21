const express = require('express');
const router = express.Router();
const {
  getIntegrations,
  updateIntegrations,
  testIntegration,
  getWhatsappTemplates,
  updateWhatsappTemplates,
} = require('../controllers/integrationController');
const { protect, authorize, tenantScope } = require('../middlewares/authMiddleware');
const { OWNER_ROLES, MARKETING_ROLES } = require('../config/merchantRoles');

router.use(protect);
router.use(tenantScope);

// The WhatsApp template mapping holds no credentials. Marketing staff run
// campaigns and need to read it; only the owner can change it.
router.get('/whatsapp-templates', authorize(...MARKETING_ROLES), getWhatsappTemplates);
router.put('/whatsapp-templates', authorize(...OWNER_ROLES), updateWhatsappTemplates);

// Payment keys, WhatsApp tokens, and courier credentials are owner-only.
router.route('/')
  .get(authorize(...OWNER_ROLES), getIntegrations)
  .put(authorize(...OWNER_ROLES), updateIntegrations);

router.post('/test', authorize(...OWNER_ROLES), testIntegration);

module.exports = router;
