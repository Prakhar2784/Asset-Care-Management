const express = require('express');
const router  = express.Router();
const AssetLoan = require('../models/AssetLoan');
const Asset     = require('../models/Asset');
const { protect, authorize } = require('../middleware/authMiddleware');

// POST /api/asset-loans/:assetId/checkout
router.post('/:assetId/checkout', protect, authorize('admin', 'hod'), async (req, res) => {
  try {
    const { borrowerId, borrowerName, borrowerEmail, purpose, expectedReturnDate, notes } = req.body;
    if (!expectedReturnDate) return res.status(400).json({ message: 'Expected return date is required.' });

    // Check no active loan already
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

    // Stamp asset status
    await Asset.findByIdAndUpdate(req.params.assetId, { status: 'In Transit' });

    const populated = await AssetLoan.findById(loan._id)
      .populate('borrower', 'name email')
      .populate('checkedOutBy', 'name');

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/asset-loans/:assetId/checkin
router.post('/:assetId/checkin', protect, authorize('admin', 'hod'), async (req, res) => {
  try {
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
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/asset-loans/:assetId — loan history
router.get('/:assetId', protect, authorize('admin', 'hod'), async (req, res) => {
  try {
    const loans = await AssetLoan.find({ asset: req.params.assetId })
      .populate('borrower', 'name email department')
      .populate('checkedOutBy', 'name')
      .populate('checkedInBy', 'name')
      .sort({ createdAt: -1 });
    res.json(loans);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/asset-loans — all loans (admin)
router.get('/', protect, authorize('admin', 'hod'), async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;
    const loans = await AssetLoan.find(filter)
      .populate('asset', 'name serialNumber category')
      .populate('borrower', 'name email department')
      .sort({ createdAt: -1 })
      .limit(200);
    res.json(loans);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
