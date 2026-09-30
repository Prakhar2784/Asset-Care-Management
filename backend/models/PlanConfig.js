// backend/models/PlanConfig.js
const mongoose = require('mongoose');

const planConfigSchema = new mongoose.Schema({
  planKey: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  }, // e.g. 'HOME_USER', 'MSME', 'LARGE_SCALE', 'CUSTOM_PLAN'
  name: {
    type: String,
    required: true,
    trim: true,
  }, // e.g. 'Home User', 'MSME', 'Large Scale', 'Custom Plan'
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
    default: 3, // -1 for unlimited
  },
  maxDepartments: {
    type: Number,
    default: 2, // -1 for unlimited
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
  // Comprehensive Feature Switches (from project comparison matrix)
  featureFlags: {
    coreInventory:     { type: Boolean, default: true },  // Core inventory & QR tagging
    ticketing:         { type: String,  default: 'basic' }, // 'basic' | 'full' | 'off'
    standardReports:   { type: Boolean, default: true },  // Standard reports
    advancedAnalytics: { type: Boolean, default: false }, // Advanced analytics
    warrantyTracking:  { type: Boolean, default: false }, // Warranty tracking & Radar
    bulkCsvImport:     { type: Boolean, default: false }, // Bulk CSV import
    slaEscalation:     { type: Boolean, default: false }, // SLA escalation engine
    customBranding:    { type: Boolean, default: false }, // Custom branding & company logo
    auditTrail:        { type: Boolean, default: false }, // Full audit trail
    dedicatedSupport:  { type: Boolean, default: false }, // Dedicated priority support
  },
  badge: {
    type: String,
    default: '',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  isCustom: {
    type: Boolean,
    default: false,
  },
  order: {
    type: Number,
    default: 0,
  }
}, { timestamps: true });

module.exports = mongoose.model('PlanConfig', planConfigSchema);
