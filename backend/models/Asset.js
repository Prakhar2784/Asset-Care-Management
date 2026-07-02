const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  formFactor: { type: String, default: 'Movable' },
  vendor: { type: String },
  modelNumber: { type: String },
  serialNumber: { type: String, required: true },
  tenantId: { type: String, required: true, default: 'default' },

  // Lifecycle Data
  procurementDate: { type: Date },
  purchaseCost: { type: Number },
  warrantyStart: { type: Date },
  warrantyEnd: { type: Date },
  supportPhone: { type: String },
  supportEmail: { type: String },

  // Purchase From Details
  purchaseFromName: { type: String },
  purchaseFromAddress: { type: String },
  purchaseFromPhone: { type: String },
  purchaseFromEmail: { type: String },
  purchaseFromGst: { type: String },

  // Service Partner Details
  servicePartnerName: { type: String },
  servicePartnerContact: { type: String },

  // AMC (Annual Maintenance Contract)
  amcVendor: { type: String },
  amcStart: { type: Date },
  amcEnd: { type: Date },
  amcCost: { type: Number },
  amcContact: { type: String },

  // Deployment Data
  department: { type: String, required: true },
  location: { type: String },
  status: {
    type: String,
    enum: ['Active', 'In Transit', 'Under Repair', 'Decommissioned', 'In Storage', 'Scrap'],
    default: 'Active'
  },
  warehouse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse',
    default: null
  },
  stockStatus: {
    type: String,
    enum: ['Available', 'Reserved', 'Damaged', 'Lost', 'Returned', 'N/A'],
    default: 'N/A'
  },

  // Assignment Data (denormalized for fast reads)
  assignedStatus: {
    type: String,
    enum: ['Unassigned', 'Assigned'],
    default: 'Unassigned'
  },
  assignedDepartment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  },
  assignedEmployeeName: { type: String },
  assignedEmployeeEmail: { type: String },
  assignedEmployeePhone: { type: String },
  assignedDate: { type: Date },

  // Link to User model
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },

  // Warranty alert tracking
  warrantyAlertSent30: { type: Boolean, default: false },
  warrantyAlertSent15: { type: Boolean, default: false },
  warrantyAlertSent7: { type: Boolean, default: false },

  // Document Vault — invoice, warranty card, AMC contract, manual, service report
  documents: [{
    docType: { type: String, enum: ['invoice', 'warranty', 'amc', 'manual', 'service'], required: true },
    originalName: { type: String, required: true },
    fileName: { type: String, required: true },
    url: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
  }],

  // Custom metadata fields (managed dynamically via CustomField config)
  customFields: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },

  // Soft delete
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null },
}, { timestamps: true });

// Indexes for performance
assetSchema.index({ status: 1 });
assetSchema.index({ department: 1 });
assetSchema.index({ assignedTo: 1 });
assetSchema.index({ isDeleted: 1 });
assetSchema.index({ createdAt: -1 });
assetSchema.index({ warrantyEnd: 1 });
assetSchema.index({ tenantId: 1 });
assetSchema.index({ serialNumber: 1, tenantId: 1 }, { unique: true });

const Asset = mongoose.model('Asset', assetSchema);
const createTenantModelProxy = require('../middleware/tenantModelProxy');
module.exports = createTenantModelProxy('Asset', Asset);
