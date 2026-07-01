const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  actorName: { type: String },
  actorRole: { type: String },
  action: { type: String, required: true },
  entity: { type: String, required: true }, // 'ticket', 'asset', 'device_request', 'user'
  entityId: { type: String },
  entityLabel: { type: String },
  changes: { type: mongoose.Schema.Types.Mixed },
  ipAddress: { type: String },
  tenantId: { type: String, required: true, default: 'default' }
}, { timestamps: true });

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ actor: 1 });
auditLogSchema.index({ entity: 1 });
auditLogSchema.index({ tenantId: 1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
const createTenantModelProxy = require('../middleware/tenantModelProxy');
module.exports = createTenantModelProxy('AuditLog', AuditLog);
