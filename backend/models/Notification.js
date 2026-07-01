const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: {
    type: String,
    enum: [
      'ticket_created', 'ticket_status', 'ticket_resolved',
      'request_approved', 'request_rejected',
      'asset_assigned', 'asset_revoked',
      'warranty_expiry', 'system'
    ],
    required: true
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  link: { type: String },
  isRead: { type: Boolean, default: false, index: true },
  meta: { type: mongoose.Schema.Types.Mixed },
  tenantId: { type: String, required: true, default: 'default' }
}, { timestamps: true });

// Compound index for fast unread count queries
notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ tenantId: 1 });

const Notification = mongoose.model('Notification', notificationSchema);
const createTenantModelProxy = require('../middleware/tenantModelProxy');
module.exports = createTenantModelProxy('Notification', Notification);
