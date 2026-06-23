const express = require('express');
const router = express.Router();
const { getSummaryReport, getAssetReport, getTicketReport } = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect, authorize('admin', 'super_admin'));

router.get('/summary', getSummaryReport);
router.get('/assets', getAssetReport);
router.get('/tickets', getTicketReport);

module.exports = router;
