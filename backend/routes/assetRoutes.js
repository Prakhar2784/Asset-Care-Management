const express = require('express');
const router = express.Router();
const {
  createAsset,
  getAssets,
  getAssetById,
  updateAsset,
  deleteAsset,
  restoreAsset,
  getDeletedAssets,
  getMyAssets,
  getActiveAssets
} = require('../controllers/assetController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Must be before /:id to avoid route conflict
router.get('/myassets', protect, getMyAssets);
router.get('/all-active', protect, getActiveAssets);
router.get('/trash', protect, authorize('admin'), getDeletedAssets);

router.route('/')
  .get(protect, authorize('admin', 'hod'), getAssets)
  .post(protect, authorize('admin'), createAsset);

router.route('/:id')
  .get(protect, authorize('admin', 'hod'), getAssetById)
  .put(protect, authorize('admin'), updateAsset)
  .delete(protect, authorize('admin'), deleteAsset);

router.put('/:id/restore', protect, authorize('admin'), restoreAsset);

module.exports = router;
