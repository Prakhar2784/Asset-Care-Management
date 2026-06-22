const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  formFactor: { type: String, default: 'Movable' },
  vendor: { type: String },
  modelNumber: { type: String },
  serialNumber: { type: String, required: true, unique: true },

  // Lifecycle Data
  procurementDate: { type: Date },
  warrantyStart: { type: Date },
  warrantyEnd: { type: Date },
  supportPhone: { type: String },
  supportEmail: { type: String },

  // Deployment Data
  department: { type: String, required: true },
  location: { type: String },
  status: {
    type: String,
    enum: ['Active', 'In Transit', 'Under Repair', 'Scrap'],
    default: 'Active'
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
  }
}, { timestamps: true });

module.exports = mongoose.model('Asset', assetSchema);
