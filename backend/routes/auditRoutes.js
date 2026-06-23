const express = require('express');
const router = express.Router();
const { getAuditLogs } = require('../controllers/auditController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', protect, authorize('admin', 'super_admin'), getAuditLogs);

module.exports = router;
