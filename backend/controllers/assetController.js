const Asset = require('../models/Asset');
const { audit } = require('../services/auditService');

// @route   POST /api/assets
// @access  Admin
const createAsset = async (req, res) => {
  try {
    const asset = await Asset.create(req.body);
    audit({ req, action: 'asset_created', entity: 'asset', entityId: asset._id, entityLabel: asset.name });
    res.status(201).json(asset);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @route   GET /api/assets
// @access  Admin / HOD
const getAssets = async (req, res) => {
  try {
    const assets = await Asset.find({}).populate('assignedTo', 'name email department');
    res.status(200).json(assets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   GET /api/assets/:id
// @access  Admin / HOD
const getAssetById = async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id).populate('assignedTo', 'name email department');
    if (!asset) return res.status(404).json({ message: 'Asset not found' });
    res.status(200).json(asset);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   PUT /api/assets/:id
// @access  Admin
const updateAsset = async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);
    if (!asset) return res.status(404).json({ message: 'Asset not found' });

    const updated = await Asset.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    audit({ req, action: 'asset_updated', entity: 'asset', entityId: asset._id, entityLabel: asset.name, changes: req.body });
    res.status(200).json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @route   DELETE /api/assets/:id
// @access  Admin
const deleteAsset = async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);
    if (!asset) return res.status(404).json({ message: 'Asset not found' });

    audit({ req, action: 'asset_deleted', entity: 'asset', entityId: asset._id, entityLabel: asset.name });
    await asset.deleteOne();
    res.status(200).json({ message: 'Asset deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   GET /api/assets/myassets
// @access  Employee (logged-in user)
const getMyAssets = async (req, res) => {
  try {
    const assets = await Asset.find({
      $or: [
        { assignedTo: req.user._id },
        { assignedEmployeeEmail: req.user.email }
      ]
    }).populate('assignedTo', 'name email department');
    res.status(200).json(assets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createAsset, getAssets, getAssetById, updateAsset, deleteAsset, getMyAssets };
