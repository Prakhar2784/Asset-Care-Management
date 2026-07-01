const express = require('express');
const router  = express.Router();
const crypto  = require('crypto');
const bcrypt  = require('bcryptjs');
const ApiKey  = require('../models/ApiKey');
const { protect, authorize } = require('../middleware/authMiddleware');

// GET /api/apikeys — list keys for current tenant (never returns full key)
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const keys = await ApiKey.find({})
      .populate('createdBy', 'name')
      .select('-keyHash')
      .sort({ createdAt: -1 });
    res.json(keys);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/apikeys — generate new key (returns full key ONCE)
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { name, scopes, expiresAt } = req.body;
    if (!name) return res.status(400).json({ message: 'Key name is required.' });

    const rawKey  = 'ac_' + crypto.randomBytes(32).toString('hex');
    const prefix  = rawKey.slice(0, 12) + '…';
    const salt    = await bcrypt.genSalt(10);
    const keyHash = await bcrypt.hash(rawKey, salt);
    const keyId   = crypto.createHash('sha256').update(rawKey).digest('hex');

    const apiKey = await ApiKey.create({
      name,
      keyHash,
      keyId,
      prefix,
      scopes:    scopes || ['read'],
      expiresAt: expiresAt || null,
      createdBy: req.user._id,
    });

    res.status(201).json({
      _id:       apiKey._id,
      name:      apiKey.name,
      prefix:    apiKey.prefix,
      scopes:    apiKey.scopes,
      expiresAt: apiKey.expiresAt,
      createdAt: apiKey.createdAt,
      fullKey:   rawKey, // shown only once
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/apikeys/:id — toggle active / rename
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { name, isActive, scopes } = req.body;
    const update = {};
    if (name     !== undefined) update.name     = name;
    if (isActive !== undefined) update.isActive = isActive;
    if (scopes   !== undefined) update.scopes   = scopes;

    const key = await ApiKey.findByIdAndUpdate(req.params.id, update, { new: true })
      .populate('createdBy', 'name')
      .select('-keyHash');
    if (!key) return res.status(404).json({ message: 'Key not found.' });
    res.json(key);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/apikeys/:id
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    await ApiKey.findByIdAndDelete(req.params.id);
    res.json({ message: 'API key deleted.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
