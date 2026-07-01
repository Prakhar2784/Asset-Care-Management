const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  invoiceNumber:  { type: String },
  vendor:         { type: String, required: true },
  vendorEmail:    { type: String },
  vendorPhone:    { type: String },
  amount:         { type: Number, default: 0 },
  invoiceDate:    { type: Date },
  dueDate:        { type: Date },
  status:         { type: String, enum: ['Paid', 'Unpaid', 'Overdue', 'Cancelled'], default: 'Unpaid' },
  assets:         [{ type: mongoose.Schema.Types.ObjectId, ref: 'Asset' }],
  category:       { type: String },
  notes:          { type: String },
  fileUrl:        { type: String },
  fileName:       { type: String },
  uploadedBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  tenantId:       { type: String, required: true, default: 'default' },
}, { timestamps: true });

invoiceSchema.index({ vendor: 1 });
invoiceSchema.index({ status: 1 });
invoiceSchema.index({ invoiceDate: -1 });
invoiceSchema.index({ tenantId: 1 });

const Invoice = mongoose.model('Invoice', invoiceSchema);
const createTenantModelProxy = require('../middleware/tenantModelProxy');
module.exports = createTenantModelProxy('Invoice', Invoice);
