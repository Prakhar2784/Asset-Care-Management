// backend/routes/dashboardRoutes.js
const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/dashboardController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/stats').get(protect, authorize('admin', 'hod'), getDashboardStats);

module.exports = router;