const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  note: { type: String, required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  authorName: { type: String, default: 'Staff' },
  createdAt: { type: Date, default: Date.now },
});

const callLogSchema = new mongoose.Schema({
  durationSeconds: { type: Number, default: 0 },
  outcome: {
    type: String,
    enum: ['CONNECTED', 'NO_ANSWER', 'BUSY', 'WRONG_NUMBER', 'CALLBACK_REQUESTED'],
    default: 'CONNECTED',
  },
  notes: { type: String, default: '' },
  loggedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  loggedByName: { type: String, default: 'Staff' },
  createdAt: { type: Date, default: Date.now },
});

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  dueDate: { type: Date, required: true },
  isCompleted: { type: Boolean, default: false },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
});

const leadSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Lead name is required'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      index: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    source: {
      type: String,
      enum: ['META_ADS', 'WEBSITE', 'MANUAL', 'WHATSAPP', 'REFERRAL', 'OTHER'],
      default: 'MANUAL',
      index: true,
    },
    campaignName: { type: String, default: '' },
    adSetName: { type: String, default: '' },
    adName: { type: String, default: '' },
    utmSource: { type: String, default: '' },
    utmMedium: { type: String, default: '' },
    utmCampaign: { type: String, default: '' },
    utmContent: { type: String, default: '' },
    fbclid: { type: String, default: '' },
    metaLeadId: { type: String, sparse: true, index: true },
    metaPageId: { type: String, default: '' },
    metaPageName: { type: String, default: '' },
    metaFormId: { type: String, default: '' },
    metaFormName: { type: String, default: '' },
    metaAdId: { type: String, default: '' },
    platform: { type: String, default: 'fb' },
    formAnswers: [
      {
        fieldKey: { type: String, default: '' },
        question: { type: String, default: '' },
        answer: { type: String, default: '' },
      },
    ],
    status: {
      type: String,
      enum: ['NEW', 'CONTACTED', 'FOLLOW_UP', 'QUALIFIED', 'QUOTATION_SENT', 'WON', 'LOST'],
      default: 'NEW',
      index: true,
    },
    budget: {
      type: Number,
      default: 0,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    assignedToName: {
      type: String,
      default: 'Unassigned',
    },
    customFields: {
      type: Map,
      of: String,
      default: {},
    },
    notes: [noteSchema],
    callLogs: [callLogSchema],
    tasks: [taskSchema],
    lostReason: {
      type: String,
      default: '',
    },
    isConvertedToOrder: {
      type: Boolean,
      default: false,
    },
    convertedOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for strict multi-tenant performance & deduplication queries
leadSchema.index({ businessId: 1, phone: 1 });
leadSchema.index({ businessId: 1, metaLeadId: 1 }, { unique: true, sparse: true });
leadSchema.index({ businessId: 1, status: 1 });
leadSchema.index({ businessId: 1, assignedTo: 1 });
leadSchema.index({ businessId: 1, createdAt: -1 });

module.exports = mongoose.model('Lead', leadSchema);
