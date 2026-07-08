// backend/routes/analyticsRoutes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getOverview,
  getAssetCostAnalysis,
  getProcurementTrends,
  getTicketTrends,
  getDepreciationSummary,
  getDepartmentScorecard,
} = require('../controllers/analyticsController');

// All analytics routes require auth + admin or hod role
router.use(protect, authorize('admin', 'hod'));

router.get('/overview', getOverview);
router.get('/asset-cost', getAssetCostAnalysis);
router.get('/procurement-trends', getProcurementTrends);
router.get('/ticket-trends', getTicketTrends);
router.get('/depreciation', getDepreciationSummary);
router.get('/department-scorecard', getDepartmentScorecard);

module.exports = router;
