// backend/src/models/MetaIntegration.js
// Stores authenticated Meta Account, Facebook Pages, Leadgen Forms, and Sync Logs per Tenant

const mongoose = require('mongoose');

const leadFormSchema = new mongoose.Schema({
  formId: { type: String, required: true },
  formName: { type: String, default: 'Lead Form' },
  status: { type: String, default: 'ACTIVE' },
  isSelected: { type: Boolean, default: true },
  leadCount: { type: Number, default: 0 },
  lastSyncedAt: { type: Date, default: null },
});

const pageSchema = new mongoose.Schema({
  pageId: { type: String, required: true },
  pageName: { type: String, required: true },
  category: { type: String, default: '' },
  pictureUrl: { type: String, default: '' },
  encryptedPageAccessToken: { type: String, required: true },
  isSubscribed: { type: Boolean, default: false },
  isSelected: { type: Boolean, default: true },
  subscribedAt: { type: Date, default: null },
  leadForms: [leadFormSchema],
});

const syncLogSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  type: {
    type: String,
    enum: ['WEBHOOK', 'MANUAL_SYNC', 'SCHEDULED_RECONCILIATION', 'OAUTH_CONNECT', 'DISCONNECT'],
    default: 'MANUAL_SYNC',
  },
  status: {
    type: String,
    enum: ['SUCCESS', 'FAILURE', 'WARNING'],
    default: 'SUCCESS',
  },
  message: { type: String, required: true },
  importedCount: { type: Number, default: 0 },
  pageId: { type: String, default: '' },
  formId: { type: String, default: '' },
  error: { type: String, default: '' },
});

const metaIntegrationSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      unique: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['DISCONNECTED', 'CONNECTED', 'EXPIRED', 'ERROR'],
      default: 'DISCONNECTED',
      index: true,
    },
    metaUserId: { type: String, default: '' },
    metaUserName: { type: String, default: '' },
    encryptedUserAccessToken: { type: String, default: '' },
    userTokenExpiresAt: { type: Date, default: null },
    pages: [pageSchema],
    lastSyncAt: { type: Date, default: null },
    lastSyncStatus: { type: String, default: '' },
    lastSyncError: { type: String, default: '' },
    totalLeadsImported: { type: Number, default: 0 },
    syncLogs: [syncLogSchema],
  },
  {
    timestamps: true,
  }
);

// Compound index for fast page lookup from webhook payloads across tenants
metaIntegrationSchema.index({ 'pages.pageId': 1, status: 1 });

module.exports = mongoose.model('MetaIntegration', metaIntegrationSchema);
