// backend/models/PlanConfig.js
const mongoose = require('mongoose');

const planConfigSchema = new mongoose.Schema({
  planKey: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  }, // e.g. 'HOME_USER', 'MSME', 'LARGE_SCALE'
  name: {
    type: String,
    required: true,
    trim: true,
  }, // e.g. 'Home User', 'MSME', 'Large Scale'
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  billingCycle: {
    type: String,
    default: 'yearly',
  },
  maxAssets: {
    type: Number,
    default: 20, // -1 or 999999999 for unlimited
  },
  maxUsers: {
    type: Number,
    default: 1,
  },
  maxDepartments: {
    type: Number,
    default: 1,
  },
  description: {
    type: String,
    default: '',
    trim: true,
  },
  features: [{
    type: String,
    trim: true,
  }],
  badge: {
    type: String,
    default: '',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  order: {
    type: Number,
    default: 0,
  }
}, { timestamps: true });

module.exports = mongoose.model('PlanConfig', planConfigSchema);
