const express = require('express');
const router = express.Router();
const {
  createLead,
  getLeads,
  getLeadById,
  updateLeadStatus,
  assignLead,
  addNote,
  logCall,
  createTask,
  toggleTask,
  getCRMStats,
  convertLeadToOrder,
} = require('../controllers/crmController');
const { protect, authorize, tenantScope } = require('../middlewares/authMiddleware');
const { enforceQuota } = require('../middlewares/quotaMiddleware');
const moduleGate = require('../middlewares/moduleGate');
const { CRM_ROLES } = require('../config/merchantRoles');

// All CRM routes are strictly guarded by JWT authentication, role checks, and
// Multi-Tenant Isolation. Inventory staff must not read customer PII.
router.use(protect);
router.use(authorize(...CRM_ROLES));
router.use(tenantScope);
router.use(moduleGate('crmLeads'));

router.route('/leads').post(enforceQuota('leads'), createLead).get(getLeads);
router.route('/stats').get(getCRMStats);

router.route('/leads/:id').get(getLeadById);
router.route('/leads/:id/status').patch(updateLeadStatus);
router.route('/leads/:id/assign').patch(assignLead);
router.route('/leads/:id/notes').post(addNote);
router.route('/leads/:id/call-logs').post(logCall);
router.route('/leads/:id/tasks').post(createTask);
router.route('/leads/:leadId/tasks/:taskId').patch(toggleTask);
router.route('/leads/:id/convert-to-order').post(convertLeadToOrder);

module.exports = router;
