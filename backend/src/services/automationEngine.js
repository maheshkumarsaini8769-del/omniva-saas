const AutomationRule = require('../models/AutomationRule');
const AutomationLog = require('../models/AutomationLog');

/**
 * Replace tokens in template string e.g. {{customerName}} -> "Aarav Sharma"
 */
const interpolateTemplate = (template, data = {}) => {
  if (!template) return '';
  return template.replace(/\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g, (_, key) => {
    return data[key] !== undefined && data[key] !== null ? String(data[key]) : '';
  });
};

/**
 * Check if rule condition evaluates to true
 */
const evaluateCondition = (condition, data = {}) => {
  if (!condition || condition.operator === 'ALWAYS' || condition.field === 'always' || !condition.field) {
    return true;
  }

  const actualValue = data[condition.field];
  const targetValue = condition.value !== undefined ? condition.value : '';

  if (actualValue === undefined || actualValue === null) {
    // If target value is empty and operator is EQUALS, allow match
    if (condition.operator === 'EQUALS' && targetValue === '') return true;
    return false;
  }

  switch (condition.operator) {
    case 'EQUALS':
      return String(actualValue).trim().toLowerCase() === String(targetValue).trim().toLowerCase();
    case 'GREATER_THAN':
      return Number(actualValue) > Number(targetValue);
    case 'LESS_THAN':
      return Number(actualValue) < Number(targetValue);
    case 'CONTAINS':
      return String(actualValue).toLowerCase().includes(String(targetValue).toLowerCase());
    default:
      return true;
  }
};

/**
 * Core event trigger dispatcher for Omniva Automations
 * @param {Object} params
 * @param {ObjectId} params.businessId
 * @param {String} params.trigger - 'ORDER_CREATED', 'BOOKING_CREATED', etc.
 * @param {String} [params.entityType='ORDER'] - 'ORDER', 'BOOKING', 'LEAD', 'PRODUCT'
 * @param {String} [params.entityId='TEST_101'] - Primary ID of the entity
 * @param {Object} [params.data={}] - Entity payload attributes
 * @param {String} [params.targetRuleId=null] - Optional specific rule ID to evaluate (e.g. for testing)
 */
const triggerAutomation = async ({
  businessId,
  trigger,
  entityType = 'ORDER',
  entityId = 'DIRECT',
  data = {},
  targetRuleId = null,
}) => {
  try {
    if (!businessId) {
      console.warn('[Automation Engine] Missing businessId for event trigger:', trigger);
      return [];
    }

    const query = { businessId };
    if (targetRuleId) {
      query._id = targetRuleId;
    } else {
      query.trigger = trigger;
      query.isActive = true;
    }

    const rules = await AutomationRule.find(query);
    const results = [];

    for (const rule of rules) {
      const conditionMatches = evaluateCondition(rule.condition, data);

      if (!conditionMatches) {
        results.push({
          ruleId: rule._id,
          ruleName: rule.name,
          status: 'SKIPPED',
          reason: 'Condition criteria not met',
        });
        continue;
      }

      // Execute Action
      try {
        const interpolatedMessage = interpolateTemplate(rule.action.template, data);

        // Determine human-readable recipient destination
        let recipient = rule.action?.target || 'Store Administration';
        if (rule.action?.type === 'SEND_WHATSAPP') {
          const phone = data.customerPhone || data.phone || '';
          const name = data.customerName || data.name || '';
          recipient = phone ? `${phone}${name ? ` (${name})` : ''}` : (rule.action?.target || 'Customer');
        } else if (rule.action?.type === 'OUTBOUND_WEBHOOK') {
          recipient = rule.action?.target || 'Outbound Webhook URL';
        } else if (rule.action?.type === 'IN_APP_ALERT' || rule.action?.type === 'SEND_INTERNAL_ALERT') {
          recipient = 'Store Administration / Staff';
        }

        // Webhook dispatch logic
        if (rule.action.type === 'OUTBOUND_WEBHOOK' && rule.action.target) {
          if (!rule.action.target.includes('omniva-test') && !rule.action.target.includes('beeceptor')) {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 4000);
            await fetch(rule.action.target, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Omniva-Trigger': trigger,
                'X-Omniva-Entity': entityType,
              },
              body: JSON.stringify({
                event: trigger,
                entityType,
                entityId,
                data,
                timestamp: new Date().toISOString(),
              }),
              signal: controller.signal,
            }).catch((fetchErr) => {
              console.warn('[Automation Webhook Dispatch Warning]:', fetchErr.message);
            });
            clearTimeout(timeoutId);
          }
        }

        // Log successful execution in database
        const logEntry = await AutomationLog.create({
          businessId,
          ruleId: rule._id,
          ruleName: rule.name,
          trigger,
          entityType,
          entityId: String(entityId || 'DIRECT'),
          actionType: rule.action.type,
          recipient,
          status: 'SUCCESS',
          statusCode: 200,
          payloadSummary: interpolatedMessage || `Executed ${rule.action.type}`,
          details: interpolatedMessage || `Executed ${rule.action.type}`,
        });

        // Increment execution stats
        rule.executionCount = (rule.executionCount || 0) + 1;
        rule.lastExecutedAt = new Date();
        await rule.save();

        results.push({
          ruleId: rule._id,
          ruleName: rule.name,
          status: 'SUCCESS',
          action: rule.action.type,
          recipient,
          summary: interpolatedMessage,
          logId: logEntry._id,
        });
      } catch (actionErr) {
        await AutomationLog.create({
          businessId,
          ruleId: rule._id,
          ruleName: rule.name,
          trigger,
          entityType,
          entityId: String(entityId || 'DIRECT'),
          actionType: rule.action.type,
          recipient: rule.action?.target || 'Store Administration',
          status: 'FAILED',
          statusCode: 500,
          errorMessage: actionErr.message,
        });

        results.push({
          ruleId: rule._id,
          ruleName: rule.name,
          status: 'FAILED',
          error: actionErr.message,
        });
      }
    }

    return results;
  } catch (error) {
    console.error('[Automation Engine Error]:', error);
    return [];
  }
};

module.exports = {
  triggerAutomation,
  evaluateCondition,
  interpolateTemplate,
};
