const mongoose = require('mongoose');

const tenantSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  slug: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true,
    trim: true
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  plan: { 
    type: String, 
    default: 'Home User',
    trim: true
  },
  branding: {
    logoUrl: { type: String, default: null },
    primaryColor: { type: String, default: '#1976d2' },
    secondaryColor: { type: String, default: '#9c27b0' }
  },
  smtp: {
    host: { type: String, default: null },
    port: { type: Number, default: null },
    user: { type: String, default: null },
    pass: { type: String, default: null },
    fromEmail: { type: String, default: null }
  },
  limits: {
    maxAssets: { type: Number, default: 20 },
    maxUsers: { type: Number, default: 3 },
    maxDepartments: { type: Number, default: 2 }
  },
  features: {
    type: mongoose.Schema.Types.Mixed,
    default: () => ({
      coreInventory: true,
      ticketing: 'basic',
      standardReports: true,
      advancedAnalytics: false,
      warrantyTracking: false,
      bulkCsvImport: false,
      slaEscalation: false,
      customBranding: false,
      auditTrail: false,
      dedicatedSupport: false,
    })
  },

  // Organisation profile
  industry:      { type: String, default: null },
  employeeCount: { type: Number, default: null },
  phone:         { type: String, default: null },
  website:       { type: String, default: null },
  contactEmail:  { type: String, default: null },
  gstNumber:     { type: String, default: null },
  panNumber:     { type: String, default: null },
  address: {
    line:     { type: String, default: null },
    city:     { type: String, default: null },
    state:    { type: String, default: null },
    pin:      { type: String, default: null },
    country:  { type: String, default: 'India' }
  },
  planSeats:   { type: Number, default: 10 },
  planExpiry: { type: Date, default: null },
  subscriptionStatus: {
    type: String,
    enum: ['Active', 'Pending Checkout', 'Expired', 'Cancelled'],
    default: 'Pending Checkout'
  },

  // Scheduled downgrade - populated when a customer requests a lower plan at next renewal.
  // Current subscription stays fully active until planExpiry; cron applies this at expiry.
  scheduledDowngrade: {
    plan:          { type: String, default: null },
    scheduledAt:   { type: Date,   default: null },
    effectiveDate: { type: Date,   default: null },
    requestedBy:   { type: String, default: null },
  },

  customerType: { type: String, enum: ['Individual', 'Business'], default: 'Business' },
  licenseKey:  { type: String, default: null },
  customPrice: { type: Number, default: null },
  customQuoteExpiry: { type: Date, default: null },
  customQuoteCreatedAt: { type: Date, default: null },
  customQuotePlan: { type: String, default: null },
  customQuoteQuotas: {
    maxAssets: { type: Number, default: null },
    maxUsers: { type: Number, default: null },
    maxDepartments: { type: Number, default: null }
  },
  customQuoteFeatures: { type: mongoose.Schema.Types.Mixed, default: null },
  allowAddonAssets: { type: Boolean, default: false },
  addonAssetPrice: { type: Number, default: 49 },
  addonAssets: { type: Number, default: 0 }
}, {
  timestamps: true 
});

// Index for fast tenant resolution
tenantSchema.index({ isActive: 1 });

module.exports = mongoose.model('Tenant', tenantSchema);
