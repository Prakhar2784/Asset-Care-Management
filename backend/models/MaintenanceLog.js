const mongoose = require('mongoose');

const maintenanceLogSchema = new mongoose.Schema({
  asset:              { type: mongoose.Schema.Types.ObjectId, ref: 'Asset', required: true },
  type:               { type: String, enum: ['Preventive', 'Corrective', 'Inspection', 'Upgrade', 'Other'], default: 'Preventive' },
  description:        { type: String, required: true, trim: true, maxlength: [1000, 'Description cannot exceed 1000 characters.'] },
  technicianName:     { type: String, trim: true, maxlength: 100 },
  technicianContact:  { type: String, trim: true, maxlength: 15 },
  vendor:             { type: String, trim: true, maxlength: 100 },
  cost:               { type: Number, default: 0 },
  serviceDate:        { type: Date, required: true },
  nextServiceDate:    { type: Date },
  status:             { type: String, enum: ['Scheduled', 'In Progress', 'Completed', 'Cancelled'], default: 'Scheduled' },
  notes:              { type: String, trim: true, maxlength: [1000, 'Notes cannot exceed 1000 characters.'] },
  loggedBy:           { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  tenantId:           { type: String, required: true, default: 'default' },
}, { timestamps: true });

maintenanceLogSchema.index({ asset: 1 });
maintenanceLogSchema.index({ serviceDate: -1 });
maintenanceLogSchema.index({ tenantId: 1 });

const MaintenanceLog = mongoose.model('MaintenanceLog', maintenanceLogSchema);
const createTenantModelProxy = require('../middleware/tenantModelProxy');
module.exports = createTenantModelProxy('MaintenanceLog', MaintenanceLog);
