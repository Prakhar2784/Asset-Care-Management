const mongoose = require('mongoose');

const serviceCenterSchema = new mongoose.Schema({
  name:           { type: String, required: true, trim: true },
  contactPerson:  { type: String, default: null },
  phone:          { type: String, default: null },
  email:          { type: String, default: null },
  address:        { type: String, default: null },
  city:           { type: String, default: null },
  categories:     [{ type: String }], // asset categories they service
  brands:         [{ type: String }], // brands they handle
  department:     { type: String, default: null }, // restricts visibility to this department (null = visible to all)
  status:         { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  notes:          { type: String, default: null },
  tenantId:       { type: String, required: true, default: 'default' },
}, { timestamps: true });

serviceCenterSchema.index({ tenantId: 1 });

const ServiceCenter = mongoose.model('ServiceCenter', serviceCenterSchema);
const createTenantModelProxy = require('../middleware/tenantModelProxy');
module.exports = createTenantModelProxy('ServiceCenter', ServiceCenter);
