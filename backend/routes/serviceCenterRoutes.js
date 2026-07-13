const express = require('express');
const router = express.Router();
const ServiceCenter = require('../models/ServiceCenter');
const Asset = require('../models/Asset');
const { protect, authorize } = require('../middleware/authMiddleware');

// GET all service centers
router.get('/', protect, async (req, res) => {
  try {
    const centers = await ServiceCenter.find({}).sort({ createdAt: -1 });
    res.json(centers);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST create service center
router.post('/', protect, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const center = await ServiceCenter.create({ ...req.body, tenantId: req.tenantId || 'default' });
    res.status(201).json(center);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// PUT update service center
router.put('/:id', protect, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const center = await ServiceCenter.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!center) return res.status(404).json({ message: 'Service center not found.' });
    res.json(center);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// DELETE service center
router.delete('/:id', protect, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    await ServiceCenter.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted.' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET warranty assets (active warranty, optional filter by category)
router.get('/warranty-assets', protect, async (req, res) => {
  try {
    const now = new Date();
    const { category } = req.query;
    const filter = { warrantyEnd: { $gte: now } };
    if (category) filter.category = category;
    const assets = await Asset.find(filter)
      .select('assetTag name category serialNumber warrantyStart warrantyEnd assignedEmployeeName assignedDepartment status')
      .sort({ warrantyEnd: 1 });
    res.json(assets);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
