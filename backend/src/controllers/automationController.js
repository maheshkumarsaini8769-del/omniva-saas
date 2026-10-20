const mongoose = require('mongoose');
const AutomationRule = require('../models/AutomationRule');
const AutomationLog = require('../models/AutomationLog');
const { triggerAutomation } = require('../services/automationEngine');

const DEFAULT_SEED_RULES = [
  {
    name: 'Order Placed Instant WhatsApp Confirmation',
    trigger: 'ORDER_CREATED',
    isActive: true,
    condition: { field: 'always', operator: 'ALWAYS', value: '' },
    action: {
      type: 'SEND_WHATSAPP',
      target: 'customer',
      template: 'Hello {{customerName}}! Your order {{orderNumber}} for ₹{{totalAmount}} has been received. We are preparing your order for dispatch. Thank you for shopping with us!',
    },
  },
  {
    name: 'Order Dispatched Courier Tracking Alert',
    trigger: 'ORDER_SHIPPED',
    isActive: true,
    condition: { field: 'always', operator: 'ALWAYS', value: '' },
    action: {
      type: 'SEND_WHATSAPP',
      target: 'customer',
      template: 'Hello {{customerName}}! Your order {{orderNumber}} has been dispatched via {{courierName}}. AWB Tracking: {{trackingNumber}}. Tracking link: {{trackingUrl}}',
    },
  },
  {
    name: 'Duplicate / Double Order Verification Alert',
    trigger: 'ORDER_CREATED',
    isActive: true,
    condition: { field: 'isDuplicate', operator: 'EQUALS', value: 'true' },
    action: {
      type: 'SEND_WHATSAPP',
      target: 'customer',
      template: 'Hello {{customerName}}! We noticed duplicate orders placed with your phone number. Could you please confirm if you would like both packages delivered?',
    },
  },
  {
    name: 'Meta Ads Lead Instant WhatsApp Greeting',
    trigger: 'LEAD_INGESTED',
    isActive: true,
    condition: { field: 'always', operator: 'ALWAYS', value: '' },
    action: {
      type: 'SEND_WHATSAPP',
      target: 'customer',
      template: 'Hello {{customerName}}! Thank you for your enquiry. Check out our store catalog here: {{menuUrl}}.',
    },
  },
  {
    name: 'Outbound ERP / Webhook Order Sync',
    trigger: 'ORDER_CONFIRMED',
    isActive: false,
    condition: { field: 'always', operator: 'ALWAYS', value: '' },
    action: {
      type: 'OUTBOUND_WEBHOOK',
      target: '',
      template: '{"orderId":"{{orderNumber}}","amount":"{{totalAmount}}","customer":"{{customerName}}"}',
    },
  },
  {
    name: 'Low Stock Inventory Alert',
    trigger: 'STOCK_LOW',
    isActive: true,
    condition: { field: 'stock', operator: 'LESS_THAN', value: '10' },
    action: {
      type: 'IN_APP_ALERT',
      target: 'merchant_admin',
      template: '⚠️ Low Stock Alert: {{productName}} inventory is low. Please replenish stock soon!',
    },
  },
];

// @desc    Get all automation rules for merchant (auto-seeds defaults if 0 rules exist)
// @route   GET /api/automations/rules
// @access  Private (Merchant Admin)
const getRules = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Automation service is temporarily unavailable. Please try again.',
      });
    }

    if (!req.businessId) {
      return res.status(400).json({ success: false, message: 'Tenant context is required' });
    }

    let rules = await AutomationRule.find({ businessId: req.businessId }).sort({ createdAt: -1 });

    if (rules.length === 0) {
      // Auto-seed starter rules, but never fabricate execution history.
      const rulesToInsert = DEFAULT_SEED_RULES.map((r) => ({
        ...r,
        businessId: req.businessId,
        executionCount: 0,
        lastExecutedAt: null,
      }));
      rules = await AutomationRule.insertMany(rulesToInsert);
    }

    res.json({ success: true, count: rules.length, data: rules });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create automation rule
// @route   POST /api/automations/rules
// @access  Private (Merchant Admin)
const createRule = async (req, res) => {
  try {
    const { name, trigger, condition, action, isActive = true } = req.body;

    if (!name || !trigger || !action || !action.type) {
      return res.status(400).json({
        success: false,
        message: 'Name, trigger, and action type are required',
      });
    }

    const rule = await AutomationRule.create({
      businessId: req.businessId,
      name: name.trim(),
      trigger,
      condition: condition || { field: 'always', operator: 'ALWAYS', value: '' },
      action,
      isActive: Boolean(isActive),
    });

    res.status(201).json({ success: true, data: rule });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update automation rule
// @route   PUT /api/automations/rules/:id
// @access  Private (Merchant Admin)
const updateRule = async (req, res) => {
  try {
    const rule = await AutomationRule.findOne({ _id: req.params.id, businessId: req.businessId });
    if (!rule) {
      return res.status(404).json({ success: false, message: 'Automation rule not found' });
    }

    const fields = ['name', 'trigger', 'condition', 'action', 'isActive'];
    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        rule[field] = req.body[field];
      }
    });

    await rule.save();
    res.json({ success: true, data: rule });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete automation rule
// @route   DELETE /api/automations/rules/:id
// @access  Private (Merchant Admin)
const deleteRule = async (req, res) => {
  try {
    const rule = await AutomationRule.findOneAndDelete({ _id: req.params.id, businessId: req.businessId });
    if (!rule) {
      return res.status(404).json({ success: false, message: 'Rule not found' });
    }
    res.json({ success: true, message: 'Automation rule deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get execution audit logs
// @route   GET /api/automations/logs
// @access  Private (Merchant Admin)
const getLogs = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Automation logs are temporarily unavailable. Please try again.',
      });
    }
    if (!req.businessId) {
      return res.status(400).json({ success: false, message: 'Tenant context is required' });
    }

    const logs = await AutomationLog.find({ businessId: req.businessId })
      .sort({ createdAt: -1 })
      .limit(50);

    const formatted = logs.map((l) => ({
      _id: l._id,
      id: l._id ? l._id.toString() : 'log_' + Date.now(),
      businessId: l.businessId,
      ruleName: l.ruleName,
      trigger: l.trigger,
      actionType: l.actionType,
      recipient: l.recipient || 'Store Administration',
      status: l.status,
      statusCode: l.statusCode || 200,
      timestamp: l.createdAt
        ? new Date(l.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) +
          ', ' +
          new Date(l.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })
        : 'Just now',
      details: l.details || l.payloadSummary || `Executed ${l.actionType}`,
      payloadSummary: l.payloadSummary || l.details,
      errorMessage: l.errorMessage || '',
    }));

    res.json({ success: true, count: formatted.length, data: formatted });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Test trigger rule simulation
// @route   POST /api/automations/test
// @access  Private (Merchant Admin)
const testTriggerRule = async (req, res) => {
  try {
    const { trigger, entityType = 'ORDER', entityId = 'TEST_101', testData, payload, ruleId } = req.body;

    const results = await triggerAutomation({
      businessId: req.businessId,
      trigger: trigger || 'ORDER_CREATED',
      entityType,
      entityId,
      data: testData || payload || {},
      targetRuleId: ruleId || null,
      dryRun: true,
    });

    res.json({
      success: true,
      dryRun: true,
      message: 'Automation test evaluated. No external messages or webhooks were sent.',
      matchedRulesCount: results.length,
      results,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getRules,
  createRule,
  updateRule,
  deleteRule,
  getLogs,
  testTriggerRule,
};
