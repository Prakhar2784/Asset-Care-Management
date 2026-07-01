const express = require('express');
const router = express.Router();
const { 
  triggerScan, 
  getScans, 
  getScanDevices, 
  importDevices, 
  ignoreDevices 
} = require('../controllers/networkController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Secure all endpoints to Admins/Super-admins only
router.use(protect);
router.use(authorize('admin', 'super_admin'));

router.post('/scan', triggerScan);
router.get('/scans', getScans);
router.get('/scans/:id/devices', getScanDevices);
router.post('/import', importDevices);
router.post('/ignore', ignoreDevices);

module.exports = router;
