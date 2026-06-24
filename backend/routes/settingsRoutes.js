const express = require('express');
const router = express.Router();
const { updateProfile, changePassword, exportMyData, getSystemStats } = require('../controllers/settingsController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.put('/profile', updateProfile);
router.put('/change-password', changePassword);
router.get('/export-data', exportMyData);
router.get('/system-stats', authorize('admin', 'super_admin'), getSystemStats);

module.exports = router;
