const express  = require('express');
const router   = express.Router();
const path     = require('path');
const Invoice  = require('../models/Invoice');
const { protect, authorize } = require('../middleware/authMiddleware');
const { invoiceUpload } = require('../middleware/upload');

// GET /api/invoices
router.get('/', protect, authorize('admin', 'hod'), async (req, res) => {
  try {
    const { search, status, vendor } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (vendor) filter.vendor = new RegExp(vendor, 'i');
    if (search) filter.$or = [
      { invoiceNumber: new RegExp(search, 'i') },
      { vendor: new RegExp(search, 'i') },
      { notes: new RegExp(search, 'i') },
    ];
    const invoices = await Invoice.find(filter)
      .populate('assets', 'name serialNumber')
      .populate('uploadedBy', 'name')
      .sort({ invoiceDate: -1 });
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/invoices
router.post('/', protect, authorize('admin'), invoiceUpload, async (req, res) => {
  try {
    const { invoiceNumber, vendor, vendorEmail, vendorPhone, amount, invoiceDate, dueDate, status, assets, category, notes } = req.body;
    if (!vendor) return res.status(400).json({ message: 'Vendor is required.' });

    let fileUrl = null, fileName = null;
    if (req.file) {
      fileUrl  = `/uploads/invoices/${req.file.filename}`;
      fileName = req.file.originalname;
    }

    const invoice = await Invoice.create({
      invoiceNumber, vendor, vendorEmail, vendorPhone,
      amount: amount ? Number(amount) : 0,
      invoiceDate, dueDate,
      status: status || 'Unpaid',
      assets: assets ? JSON.parse(assets) : [],
      category, notes,
      fileUrl, fileName,
      uploadedBy: req.user._id,
    });

    const populated = await Invoice.findById(invoice._id)
      .populate('assets', 'name serialNumber')
      .populate('uploadedBy', 'name');

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/invoices/:id
router.put('/:id', protect, authorize('admin'), invoiceUpload, async (req, res) => {
  try {
    const update = { ...req.body };
    if (update.assets) update.assets = JSON.parse(update.assets);
    if (update.amount) update.amount = Number(update.amount);
    if (req.file) {
      update.fileUrl  = `/uploads/invoices/${req.file.filename}`;
      update.fileName = req.file.originalname;
    }
    const invoice = await Invoice.findByIdAndUpdate(req.params.id, update, { new: true })
      .populate('assets', 'name serialNumber')
      .populate('uploadedBy', 'name');
    if (!invoice) return res.status(404).json({ message: 'Invoice not found.' });
    res.json(invoice);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/invoices/:id
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    await Invoice.findByIdAndDelete(req.params.id);
    res.json({ message: 'Invoice deleted.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
