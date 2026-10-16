const AuditLog = require('../models/AuditLog');

const logAction = async ({
  actorId = null,
  actorName = 'System',
  actorRole = 'system',
  action,
  resourceType,
  resourceId = null,
  metadata = {},
}) => {
  try {
    await AuditLog.create({
      actorId,
      actorName,
      actorRole,
      action,
      resourceType,
      resourceId: resourceId ? String(resourceId) : null,
      metadata,
    });
  } catch (err) {
    console.error('[AuditLog Error]:', err.message);
  }
};

module.exports = { logAction };
