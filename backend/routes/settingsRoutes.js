const express = require('express');
const router = express.Router();
const { 
  updateProfile, 
  changePassword, 
  exportMyData, 
  getSystemStats, 
  getTenantSettings, 
  updateTenantSettings 
} = require('../controllers/settingsController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.put('/profile', updateProfile);
router.put('/change-password', changePassword);
router.get('/export-data', exportMyData);
router.get('/system-stats', authorize('admin', 'super_admin'), getSystemStats);
router.get('/tenant', authorize('admin', 'super_admin'), getTenantSettings);
router.put('/tenant', authorize('admin', 'super_admin'), updateTenantSettings);

module.exports = router;
