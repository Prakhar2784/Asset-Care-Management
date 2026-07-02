const express = require('express');
const router  = express.Router();
const MaintenanceLog = require('../models/MaintenanceLog');
const ServiceCenter = require('../models/ServiceCenter');
const Asset = require('../models/Asset');
const { protect, authorize } = require('../middleware/authMiddleware');

const syncServiceCenterFromMaintenance = async (req, log) => {
  if (!log.vendor || !log.vendor.trim()) return;

  const tenantId = req.tenantId || 'default';
  const name = log.vendor.trim();

  try {
    const asset = await Asset.findById(log.asset);
    const category = asset ? asset.category : null;
    const brand = asset ? asset.vendor : null;

    let sc = await ServiceCenter.findOne({ name, tenantId });

    if (!sc) {
      sc = await ServiceCenter.create({
        name,
        contactPerson: log.technicianName || null,
        phone: log.technicianContact || null,
        categories: category ? [category] : [],
        brands: brand ? [brand] : [],
        status: 'Active',
        notes: 'Automatically created from maintenance logging',
        tenantId
      });
      console.log(`[SERVICE CENTER SYNC] Created new service center from maintenance: ${name}`);
    } else {
      let updated = false;
      if (log.technicianName && sc.contactPerson !== log.technicianName) {
        sc.contactPerson = log.technicianName;
        updated = true;
      }
      if (log.technicianContact && sc.phone !== log.technicianContact) {
        sc.phone = log.technicianContact;
        updated = true;
      }
      if (category && !sc.categories.includes(category)) {
        sc.categories.push(category);
        updated = true;
      }
      if (brand && !sc.brands.includes(brand)) {
        sc.brands.push(brand);
        updated = true;
      }
      if (updated) {
        await sc.save();
        console.log(`[SERVICE CENTER SYNC] Updated service center from maintenance: ${name}`);
      }
    }
  } catch (err) {
    console.error('[SERVICE CENTER SYNC ERROR]:', err.message);
  }
};

// POST /api/maintenance/:assetId
router.post('/:assetId', protect, authorize('admin', 'it_support', 'technician'), async (req, res) => {
  try {
    const { type, description, technicianName, technicianContact, vendor, cost, serviceDate, nextServiceDate, status, notes } = req.body;
    if (!description || !serviceDate) return res.status(400).json({ message: 'Description and service date are required.' });

    const log = await MaintenanceLog.create({
      asset: req.params.assetId,
      type, description, technicianName, technicianContact, vendor,
      cost: cost || 0, serviceDate, nextServiceDate, status, notes,
      loggedBy: req.user._id,
    });

    await syncServiceCenterFromMaintenance(req, log);

    if (['In Progress', 'Scheduled'].includes(status)) {
      await Asset.findByIdAndUpdate(req.params.assetId, { status: 'Under Repair' });
    } else if (status === 'Completed') {
      await Asset.findByIdAndUpdate(req.params.assetId, { status: 'Active' });
    }

    const populated = await MaintenanceLog.findById(log._id).populate('loggedBy', 'name');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/maintenance — get all maintenance logs in the system
router.get('/', protect, authorize('admin', 'hod', 'it_support', 'technician'), async (req, res) => {
  try {
    const logs = await MaintenanceLog.find()
      .populate('asset', 'name serialNumber category')
      .populate('loggedBy', 'name')
      .sort({ serviceDate: -1 });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/maintenance/:assetId
router.get('/:assetId', protect, authorize('admin', 'hod', 'it_support', 'technician'), async (req, res) => {
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
router.put('/log/:id', protect, authorize('admin', 'it_support', 'technician'), async (req, res) => {
  try {
    const log = await MaintenanceLog.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('loggedBy', 'name');
    if (!log) return res.status(404).json({ message: 'Log not found.' });
    await syncServiceCenterFromMaintenance(req, log);

    if (['In Progress', 'Scheduled'].includes(log.status)) {
      await Asset.findByIdAndUpdate(log.asset, { status: 'Under Repair' });
    } else if (log.status === 'Completed') {
      await Asset.findByIdAndUpdate(log.asset, { status: 'Active' });
    }

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
