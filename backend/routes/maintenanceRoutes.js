const express = require('express');
const router  = express.Router();
const MaintenanceLog = require('../models/MaintenanceLog');
const { protect, authorize } = require('../middleware/authMiddleware');

// POST /api/maintenance/:assetId
router.post('/:assetId', protect, authorize('admin', 'it_support'), async (req, res) => {
  try {
    const { type, description, technicianName, technicianContact, vendor, cost, serviceDate, nextServiceDate, status, notes } = req.body;
    if (!description || !serviceDate) return res.status(400).json({ message: 'Description and service date are required.' });

    const log = await MaintenanceLog.create({
      asset: req.params.assetId,
      type, description, technicianName, technicianContact, vendor,
      cost: cost || 0, serviceDate, nextServiceDate, status, notes,
      loggedBy: req.user._id,
    });

    const populated = await MaintenanceLog.findById(log._id).populate('loggedBy', 'name');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/maintenance/:assetId
router.get('/:assetId', protect, authorize('admin', 'hod', 'it_support'), async (req, res) => {
  try {
    const logs = await MaintenanceLog.find({ asset: req.params.assetId })
      .populate('loggedBy', 'name')
      .sort({ serviceDate: -1 });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/maintenance/log/:id — edit a log entry
router.put('/log/:id', protect, authorize('admin', 'it_support'), async (req, res) => {
  try {
    const log = await MaintenanceLog.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('loggedBy', 'name');
    if (!log) return res.status(404).json({ message: 'Log not found.' });
    res.json(log);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/maintenance/log/:id
router.delete('/log/:id', protect, authorize('admin'), async (req, res) => {
  try {
    await MaintenanceLog.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
