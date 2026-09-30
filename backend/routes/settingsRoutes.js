const express = require('express');
const router = express.Router();
const {
  updateProfile,
  changePassword,
  exportMyData,
  getSystemStats,
  getTenantSettings,
  updateTenantSettings,
  getTenantProfile,
  uploadTenantLogo
} = require('../controllers/settingsController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { logoUpload } = require('../middleware/upload');

router.use(protect);

router.put('/profile', updateProfile);
router.put('/change-password', changePassword);
router.get('/export-data', exportMyData);
router.get('/system-stats', authorize('admin', 'super_admin'), getSystemStats);
router.get('/tenant/profile', getTenantProfile);
router.post('/tenant/logo', authorize('admin', 'super_admin'), logoUpload, uploadTenantLogo);
router.get('/tenant', authorize('admin', 'super_admin'), getTenantSettings);
router.put('/tenant', authorize('admin', 'super_admin'), updateTenantSettings);

module.exports = router;
