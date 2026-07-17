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
  uploadAssetDocuments,
  deleteAssetDocument,
  getScanAsset,
} = require('../controllers/assetController');
const { protect, authorize, requirePermission } = require('../middleware/authMiddleware');
const { assetDocUpload } = require('../middleware/upload');

// QR scan — auth only, no permission gate
router.get('/scan/:id', protect, getScanAsset);

// Must be before /:id to avoid route conflict
router.get('/next-tag', protect, async (req, res) => {
  try {
    const Asset = require('../models/Asset');
    const assets = await Asset.find({ assetTag: /^ITV\d+$/i }).select('assetTag');
    const max = assets.reduce((m, a) => {
      const n = parseInt(a.assetTag.replace(/^ITV/i, ''), 10);
      return n > m ? n : m;
    }, 0);
    const next = `ITV${String(max + 1).padStart(3, '0')}`;
    res.json({ nextTag: next });
  } catch (err) { res.status(500).json({ message: err.message }); }
});
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
  .delete(protect, requirePermission('Edit / Delete Assets'), deleteAsset);

router.put('/:id/restore',   protect, requirePermission('Edit / Delete Assets'), restoreAsset);
router.get('/:id/timeline',  protect, requirePermission('View All Assets'), getAssetTimeline);

router.post('/:id/documents',
  protect, requirePermission('Register Assets', 'Edit / Delete Assets'),
  assetDocUpload, uploadAssetDocuments);
router.delete('/:id/documents/:docId',
  protect, requirePermission('Edit / Delete Assets'), deleteAssetDocument);

module.exports = router;
