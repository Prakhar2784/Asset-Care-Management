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
  ipAddress: { type: String }
}, { timestamps: true });

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ actor: 1 });
auditLogSchema.index({ entity: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
