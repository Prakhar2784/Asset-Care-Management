// backend/routes/slaRoutes.js
const express = require('express');
const router  = express.Router();
const { getSLAConfig, getSLABreaches } = require('../controllers/slaController');
const { protect, authorize } = require('../middleware/authMiddleware');

// GET /api/sla/config   — fetch SLA threshold configuration
router.get('/config', protect, authorize('admin', 'hod', 'super_admin'), getSLAConfig);

// GET /api/sla/breaches — fetch all currently breached tickets
router.get('/breaches', protect, authorize('admin', 'hod', 'super_admin'), getSLABreaches);

module.exports = router;
