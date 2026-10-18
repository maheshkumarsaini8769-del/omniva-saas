const express = require('express');
const router = express.Router();
const {
  getIntegrations,
  updateIntegrations,
  testIntegration,
} = require('../controllers/integrationController');
const { protect, tenantScope } = require('../middlewares/authMiddleware');

router.use(protect);
router.use(tenantScope);

router.route('/')
  .get(getIntegrations)
  .put(updateIntegrations);

router.post('/test', testIntegration);

module.exports = router;
