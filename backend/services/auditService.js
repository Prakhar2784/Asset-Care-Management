const AuditLog = require('../models/AuditLog');

const audit = async ({ req, action, entity, entityId, entityLabel, changes }) => {
  try {
    const actor = req?.user;
    await AuditLog.create({
      actor: actor?._id || null,
      actorName: actor?.name || 'System',
      actorRole: actor?.role || 'system',
      action,
      entity,
      entityId: entityId ? String(entityId) : null,
      entityLabel: entityLabel || null,
      changes: changes || null,
      ipAddress: req?.ip || null
    });
  } catch (err) {
    console.error('[AuditService] Failed to write audit log:', err.message);
  }
};

module.exports = { audit };
