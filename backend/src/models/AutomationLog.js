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
  },
  {
    timestamps: true,
  }
);

automationLogSchema.index({ businessId: 1, createdAt: -1 });

module.exports = mongoose.model('AutomationLog', automationLogSchema);
