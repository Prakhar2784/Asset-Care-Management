// backend/routes/assetRoutes.js
const express = require('express');
const router = express.Router();
const { createAsset, getAssets, getMyAssets } = require('../controllers/assetController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Routes accessible by all logged-in users
router.get('/myassets', protect, getMyAssets);

// Routes restricted to Admins
router.route('/')
  .post(protect, authorize('admin'), createAsset)
  .get(protect, authorize('admin', 'hod'), getAssets);

module.exports = router;