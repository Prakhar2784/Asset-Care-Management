const express = require('express');
const router = express.Router();
const {
  createAsset,
  getAssets,
  getAssetById,
  updateAsset,
  deleteAsset,
  getMyAssets
} = require('../controllers/assetController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Must be before /:id to avoid route conflict
router.get('/myassets', protect, getMyAssets);

router.route('/')
  .get(protect, authorize('admin', 'hod'), getAssets)
  .post(protect, authorize('admin'), createAsset);

router.route('/:id')
  .get(protect, authorize('admin', 'hod'), getAssetById)
  .put(protect, authorize('admin'), updateAsset)
  .delete(protect, authorize('admin'), deleteAsset);

module.exports = router;
