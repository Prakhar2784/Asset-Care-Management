// backend/models/GlobalSetting.js
const mongoose = require('mongoose');

const globalSettingSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    default: 'platform_settings'
  },
  allowAddonAssets: {
    type: Boolean,
    default: true
  },
  addonAssetPrice: {
    type: Number,
    default: 49,
    min: 1
  }
}, { timestamps: true });

module.exports = mongoose.model('GlobalSetting', globalSettingSchema);
