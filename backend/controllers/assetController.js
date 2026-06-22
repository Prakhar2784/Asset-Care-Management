// backend/controllers/assetController.js
const Asset = require('../models/Asset');

// @desc    Provision a new asset
// @route   POST /api/assets
// @access  Private (Admin only)
const createAsset = async (req, res) => {
  try {
    const asset = await Asset.create(req.body);
    res.status(201).json(asset);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get all assets (Asset Registry)
// @route   GET /api/assets
// @access  Private (Admin/HOD)
const getAssets = async (req, res) => {
  try {
    // Optionally populate the assigned user's name
    const assets = await Asset.find({}).populate('assignedTo', 'name email');
    res.status(200).json(assets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get assets assigned to logged-in user (Employee Portal)
// @route   GET /api/assets/myassets
// @access  Private
const getMyAssets = async (req, res) => {
  try {
    const assets = await Asset.find({ assignedTo: req.user._id });
    res.status(200).json(assets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createAsset,
  getAssets,
  getMyAssets
};