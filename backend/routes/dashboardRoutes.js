// backend/routes/dashboardRoutes.js
const express = require('express');
const router = express.Router();
const { getDashboardStats, getDateHistory } = require('../controllers/dashboardController');
const { protect, requirePermission } = require('../middleware/authMiddleware');

router.route('/stats').get(protect, requirePermission('View Dashboard'), getDashboardStats);
router.route('/date-history').get(protect, getDateHistory);

module.exports = router;
