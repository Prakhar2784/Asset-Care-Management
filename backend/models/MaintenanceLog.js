const mongoose = require('mongoose');

const maintenanceLogSchema = new mongoose.Schema({
  asset:              { type: mongoose.Schema.Types.ObjectId, ref: 'Asset', required: true },
  type:               { type: String, enum: ['Preventive', 'Corrective', 'Inspection', 'Upgrade', 'Other'], default: 'Preventive' },
  description:        { type: String, required: true },
  technicianName:     { type: String },
  technicianContact:  { type: String },
  vendor:             { type: String },
  cost:               { type: Number, default: 0 },
  serviceDate:        { type: Date, required: true },
  nextServiceDate:    { type: Date },
  status:             { type: String, enum: ['Completed', 'Pending', 'In Progress'], default: 'Completed' },
  notes:              { type: String },
  loggedBy:           { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  tenantId:           { type: String, required: true, default: 'default' },
}, { timestamps: true });

maintenanceLogSchema.index({ asset: 1 });
maintenanceLogSchema.index({ serviceDate: -1 });
maintenanceLogSchema.index({ tenantId: 1 });

const MaintenanceLog = mongoose.model('MaintenanceLog', maintenanceLogSchema);
const createTenantModelProxy = require('../middleware/tenantModelProxy');
module.exports = createTenantModelProxy('MaintenanceLog', MaintenanceLog);
