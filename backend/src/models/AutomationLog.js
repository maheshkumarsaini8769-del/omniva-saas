const mongoose = require('mongoose');

const automationLogSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: [true, 'Tenant business ID is required'],
      index: true,
    },
    ruleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AutomationRule',
      default: null,
    },
    ruleName: {
      type: String,
      default: 'Direct Trigger',
    },
    trigger: {
      type: String,
      required: true,
      index: true,
    },
    entityType: {
      type: String,
      enum: ['ORDER', 'BOOKING', 'LEAD', 'PRODUCT'],
      required: true,
    },
    entityId: {
      type: String,
      required: true,
    },
    actionType: {
      type: String,
      required: true,
    },
    recipient: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['SUCCESS', 'FAILED', 'SKIPPED'],
      default: 'SUCCESS',
      index: true,
    },
    statusCode: {
      type: Number,
      default: 200,
    },
    payloadSummary: {
      type: String,
      default: '',
    },
    details: {
      type: String,
      default: '',
    },
    errorMessage: {
      type: String,
      default: '',
    },
    // Provider that executed the action, e.g. 'meta_whatsapp'.
    provider: {
      type: String,
      default: '',
    },
    // Provider message id (Meta wamid). Used to match an inbound reply back
    // to the order that triggered the message.
    providerMessageId: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

automationLogSchema.index({ businessId: 1, createdAt: -1 });
// Only logs that actually carry a provider message id are indexed, so the
// index stays small and useful for reply matching.
automationLogSchema.index(
  { providerMessageId: 1 },
  {
    name: 'provider_message_id_partial',
    partialFilterExpression: { providerMessageId: { $gt: '' } },
  }
);

module.exports = mongoose.model('AutomationLog', automationLogSchema);
