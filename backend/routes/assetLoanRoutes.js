const express = require('express');
const router  = express.Router();
const AssetLoan = require('../models/AssetLoan');
const Asset     = require('../models/Asset');
const { protect, authorize } = require('../middleware/authMiddleware');
const asyncHandler = require('../utils/asyncHandler');

// Helper: for HOD, verify the asset belongs to their department
const assertHodAssetAccess = async (req, assetId) => {
  if (req.user.role !== 'hod' || !req.user.department) return null;
  const asset = await Asset.findById(assetId).select('department');
  if (!asset || asset.department !== req.user.department) {
    return { status: 403, message: 'Not authorized to manage assets outside your department.' };
  }
  return null;
};

// POST /api/asset-loans/:assetId/checkout
router.post('/:assetId/checkout', protect, authorize('admin', 'hod'), asyncHandler(async (req, res) => {
  const denied = await assertHodAssetAccess(req, req.params.assetId);
  if (denied) return res.status(denied.status).json({ message: denied.message });

  const { borrowerId, borrowerName, borrowerEmail, purpose, expectedReturnDate, notes } = req.body;
  if (!expectedReturnDate) return res.status(400).json({ message: 'Expected return date is required.' });

  const existing = await AssetLoan.findOne({ asset: req.params.assetId, status: 'Active' });
  if (existing) return res.status(400).json({ message: 'This asset already has an active loan.' });

  const loan = await AssetLoan.create({
    asset: req.params.assetId,
    borrower: borrowerId || req.user._id,
    borrowerName,
    borrowerEmail,
    purpose,
    expectedReturnDate,
    notes,
    checkedOutBy: req.user._id,
  });

  await Asset.findByIdAndUpdate(req.params.assetId, { status: 'In Transit' });

  const populated = await AssetLoan.findById(loan._id)
    .populate('borrower', 'name email')
    .populate('checkedOutBy', 'name');

  res.status(201).json(populated);
}));

// POST /api/asset-loans/:assetId/checkin
router.post('/:assetId/checkin', protect, authorize('admin', 'hod'), asyncHandler(async (req, res) => {
  const denied = await assertHodAssetAccess(req, req.params.assetId);
  if (denied) return res.status(denied.status).json({ message: denied.message });

  const { notes } = req.body;
  const loan = await AssetLoan.findOne({ asset: req.params.assetId, status: 'Active' });
  if (!loan) return res.status(404).json({ message: 'No active loan found for this asset.' });

  loan.status = 'Returned';
  loan.actualReturnDate = new Date();
  loan.checkedInBy = req.user._id;
  if (notes) loan.notes = (loan.notes ? loan.notes + '\n' : '') + 'Return notes: ' + notes;
  await loan.save();

  await Asset.findByIdAndUpdate(req.params.assetId, { status: 'Active' });

  res.json(loan);
}));

// GET /api/asset-loans/:assetId — loan history
router.get('/:assetId', protect, authorize('admin', 'hod'), asyncHandler(async (req, res) => {
  const denied = await assertHodAssetAccess(req, req.params.assetId);
  if (denied) return res.status(denied.status).json({ message: denied.message });

  const loans = await AssetLoan.find({ asset: req.params.assetId })
    .populate('borrower', 'name email department')
    .populate('checkedOutBy', 'name')
    .populate('checkedInBy', 'name')
    .sort({ createdAt: -1 });
  res.json(loans);
}));

// GET /api/asset-loans — all loans (admin)
router.get('/', protect, authorize('admin', 'hod'), asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (req.user.role === 'hod' && req.user.department) {
    const deptAssets = await Asset.find({ department: req.user.department, isDeleted: { $ne: true } }).select('_id');
    filter.asset = { $in: deptAssets.map(a => a._id) };
  }
  const loans = await AssetLoan.find(filter)
    .populate('asset', 'name serialNumber category')
    .populate('borrower', 'name email department')
    .sort({ createdAt: -1 })
    .limit(200);
  res.json(loans);
}));

module.exports = router;
