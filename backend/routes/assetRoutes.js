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
  getActiveAssets,
  bulkImportAssets,
  getAssetTimeline,
} = require('../controllers/assetController');
const { protect, authorize, requirePermission } = require('../middleware/authMiddleware');

// Must be before /:id to avoid route conflict
router.get('/myassets',    protect, getMyAssets);
router.get('/all-active',  protect, getActiveAssets);
router.get('/trash',       protect, requirePermission('View All Assets'), getDeletedAssets);
router.post('/bulk-import',protect, requirePermission('Register Assets'), bulkImportAssets);

router.route('/')
  .get(protect,  requirePermission('View All Assets', 'Register Assets', 'Edit / Delete Assets', 'Assign Assets'), getAssets)
  .post(protect, requirePermission('Register Assets'), createAsset);

router.route('/:id')
  .get(protect,    requirePermission('View All Assets', 'Register Assets', 'Edit / Delete Assets', 'Assign Assets'), getAssetById)
  .put(protect,    requirePermission('Edit / Delete Assets'), updateAsset)
  .delete(protect,  requirePermission('Edit / Delete Assets'), deleteAsset);

router.put('/:id/restore',   protect, requirePermission('Edit / Delete Assets'), restoreAsset);
router.get('/:id/timeline',  protect, requirePermission('View All Assets'), getAssetTimeline);

module.exports = router;
