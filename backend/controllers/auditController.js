const AuditLog = require('../models/AuditLog');

// GET /api/audit?page=1&limit=50&entity=ticket&action=status_changed
const getAuditLogs = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 50);
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.entity) filter.entity = req.query.entity;
    if (req.query.action) filter.action = { $regex: req.query.action, $options: 'i' };
    if (req.query.actor) filter.actor = req.query.actor;

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate('actor', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      AuditLog.countDocuments(filter)
    ]);

    res.status(200).json({ logs, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getAuditLogs };
