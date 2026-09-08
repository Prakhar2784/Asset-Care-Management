const express = require('express');
const router = express.Router();
const { getSummaryReport, getAssetReport, getTicketReport, getLifecycleReport } = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { checkFeatureAccess } = require('../middleware/limitMiddleware');

const reportsGuard = checkFeatureAccess(
  'complianceReports',
  'Compliance and Lifecycle Reports are available on MSME and Large Scale plans. Please upgrade your subscription to access exportable reports.'
);

router.use(protect, authorize('admin', 'super_admin'), reportsGuard);

router.get('/summary', getSummaryReport);
router.get('/assets', getAssetReport);
router.get('/tickets', getTicketReport);
router.get('/lifecycle', getLifecycleReport);

module.exports = router;

