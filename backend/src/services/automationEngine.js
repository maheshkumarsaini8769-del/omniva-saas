const AutomationRule = require('../models/AutomationRule');
const AutomationLog = require('../models/AutomationLog');
const Tenant = require('../models/Tenant');
const { assertSafeOutboundUrl } = require('../utils/outboundUrlGuard');

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
 * @param {Boolean} [params.dryRun=false] - Evaluate rules without dispatching external messages/webhooks
 */
const triggerAutomation = async ({
  businessId,
  trigger,
  entityType = 'ORDER',
  entityId = 'DIRECT',
  data = {},
  targetRuleId = null,
  dryRun = false,
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
      let interpolatedMessage = '';
      let actionType = rule.action?.type;
      let recipient = rule.action?.target || 'Store Administration';
      try {
        interpolatedMessage = interpolateTemplate(rule.action.template, data);

        if (dryRun) {
          const logEntry = await AutomationLog.create({
            businessId,
            ruleId: rule._id,
            ruleName: rule.name,
            trigger,
            entityType,
            entityId: String(entityId || 'TEST'),
            actionType: actionType || 'UNKNOWN',
            recipient,
            status: 'SKIPPED',
            statusCode: 0,
            payloadSummary: interpolatedMessage || `Dry-run ${actionType || 'action'}`,
            details: interpolatedMessage || `Dry-run ${actionType || 'action'}`,
            errorMessage: 'Dry run: no external message or webhook was sent',
          });
          results.push({
            ruleId: rule._id,
            ruleName: rule.name,
            status: 'SKIPPED',
            action: actionType,
            recipient,
            reason: 'Dry run: no external message or webhook was sent',
            summary: interpolatedMessage,
            logId: logEntry._id,
          });
          continue;
        }
        actionType = rule.action?.type;

        // Determine human-readable recipient destination
        let skippedReason = '';
        let customerPhone = '';

        if (actionType === 'SEND_WHATSAPP') {
          customerPhone = String(data.customerPhone || data.phone || '').replace(/\D/g, '');
          const name = data.customerName || data.name || '';
          recipient = customerPhone
            ? `${customerPhone}${name ? ` (${name})` : ''}`
            : (rule.action?.target || 'Customer');

          if (!customerPhone) {
            skippedReason = 'No customer phone number is available for WhatsApp delivery';
          } else {
            const tenant = await Tenant.findById(businessId).select('integrations.whatsapp');
            const wa = tenant?.integrations?.whatsapp || {};
            // Use only the merchant's own credentials. A platform-level fallback
            // would send from the wrong number and mask a missing tenant setup.
            const accessToken = wa.accessToken;
            const phoneNumberId = wa.phoneNumberId;

            if (!accessToken || !phoneNumberId) {
              skippedReason = 'Merchant has not configured WhatsApp Business API credentials';
            } else {
              const to = customerPhone.length === 10 ? `91${customerPhone}` : customerPhone;
              const response = await fetch(
                `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
                {
                  method: 'POST',
                  headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    messaging_product: 'whatsapp',
                    to,
                    type: 'text',
                    text: { body: interpolatedMessage },
                  }),
                  signal: AbortSignal.timeout(5000),
                }
              );
              if (!response.ok) {
                const body = await response.text().catch(() => '');
                throw new Error(
                  `WhatsApp Cloud API returned HTTP ${response.status}${body ? `: ${body.slice(0, 200)}` : ''}`
                );
              }
            }
          }
        } else if (actionType === 'OUTBOUND_WEBHOOK') {
          recipient = rule.action?.target || 'Outbound Webhook URL';

          if (!rule.action?.target) {
            skippedReason = 'No outbound webhook URL is configured';
          } else {
            // Older starter rules pointed at a public shared test sink. Never
            // send tenant data there, even if such a rule still exists in the DB.
            const isLegacyTestSink = rule.action.target.includes('omniva-test-webhook');

            if (isLegacyTestSink) {
              skippedReason = 'Legacy test webhook target is disabled';
            } else {
              await assertSafeOutboundUrl(rule.action.target);

              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 4000);
              try {
                const response = await fetch(rule.action.target, {
                  method: 'POST',
                  redirect: 'error',
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
                });
                if (!response.ok) {
                  throw new Error(`Webhook returned HTTP ${response.status}`);
                }
              } finally {
                clearTimeout(timeoutId);
              }
            }
          }
        } else if (actionType === 'IN_APP_ALERT' || actionType === 'SEND_INTERNAL_ALERT') {
          recipient = 'Store Administration / Staff';
          skippedReason = 'In-app alert delivery is not configured';
        } else if (actionType === 'ASSIGN_STAFF') {
          skippedReason = 'Staff assignment action is not configured';
        } else {
          skippedReason = `Unsupported automation action: ${actionType || 'none'}`;
        }

        if (skippedReason) {
          const logEntry = await AutomationLog.create({
            businessId,
            ruleId: rule._id,
            ruleName: rule.name,
            trigger,
            entityType,
            entityId: String(entityId || 'DIRECT'),
            actionType: actionType || 'UNKNOWN',
            recipient,
            status: 'SKIPPED',
            statusCode: 0,
            payloadSummary: interpolatedMessage || `Skipped ${actionType}`,
            details: interpolatedMessage || `Skipped ${actionType}`,
            errorMessage: skippedReason,
          });

          results.push({
            ruleId: rule._id,
            ruleName: rule.name,
            status: 'SKIPPED',
            action: actionType,
            recipient,
            reason: skippedReason,
            summary: interpolatedMessage,
            logId: logEntry._id,
          });
          continue;
        }

        // Log successful execution in database only after the action really ran.
        const logEntry = await AutomationLog.create({
          businessId,
          ruleId: rule._id,
          ruleName: rule.name,
          trigger,
          entityType,
          entityId: String(entityId || 'DIRECT'),
          actionType,
          recipient,
          status: 'SUCCESS',
          statusCode: 200,
          payloadSummary: interpolatedMessage || `Executed ${actionType}`,
          details: interpolatedMessage || `Executed ${actionType}`,
        });

        // Increment execution stats only for real dispatches.
        rule.executionCount = (rule.executionCount || 0) + 1;
        rule.lastExecutedAt = new Date();
        await rule.save();

        results.push({
          ruleId: rule._id,
          ruleName: rule.name,
          status: 'SUCCESS',
          action: actionType,
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
          payloadSummary: interpolatedMessage || `Failed ${actionType || 'action'}`,
          details: interpolatedMessage || actionErr.message,
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
