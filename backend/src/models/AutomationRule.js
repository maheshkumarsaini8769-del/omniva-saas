const mongoose = require('mongoose');

const automationRuleSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: [true, 'Tenant business ID is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Rule name is required'],
      trim: true,
    },
    trigger: {
      type: String,
      enum: [
        'ORDER_CREATED',
        'ORDER_CONFIRMED',
        'ORDER_SHIPPED',
        'BOOKING_CREATED',
        'BOOKING_CONFIRMED',
        'LEAD_INGESTED',
        'STOCK_LOW',
        'ABANDONED_CHECKOUT',
      ],
      required: [true, 'Trigger event is required'],
      index: true,
    },
    condition: {
      field: { type: String, default: 'always' }, // e.g. 'totalAmount', 'paymentMethod', 'always'
      operator: { type: String, enum: ['ALWAYS', 'EQUALS', 'GREATER_THAN', 'LESS_THAN', 'CONTAINS'], default: 'ALWAYS' },
      value: { type: String, default: '' },
    },
    action: {
      type: {
        type: String,
        enum: ['SEND_WHATSAPP', 'ASSIGN_STAFF', 'OUTBOUND_WEBHOOK', 'IN_APP_ALERT', 'SEND_INTERNAL_ALERT'],
        required: [true, 'Action type is required'],
      },
      target: { type: String, default: '' }, // staff ID, destination phone, or webhook URL
      template: {
        type: String,
        default: 'Automated notification from Omniva: {{message}}',
      },
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    executionCount: {
      type: Number,
      default: 0,
    },
    lastExecutedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

automationRuleSchema.index({ businessId: 1, trigger: 1, isActive: 1 });

module.exports = mongoose.model('AutomationRule', automationRuleSchema);
