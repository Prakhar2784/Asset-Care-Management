const mongoose = require('mongoose');

const assetLoanSchema = new mongoose.Schema({
  asset:              { type: mongoose.Schema.Types.ObjectId, ref: 'Asset', required: true },
  borrower:           { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  borrowerName:       { type: String },
  borrowerEmail:      { type: String },
  purpose:            { type: String },
  checkoutDate:       { type: Date, default: Date.now },
  expectedReturnDate: { type: Date, required: true },
  actualReturnDate:   { type: Date, default: null },
  status:             { type: String, enum: ['Active', 'Returned', 'Overdue'], default: 'Active' },
  notes:              { type: String },
  checkedOutBy:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  checkedInBy:        { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  tenantId:           { type: String, required: true, default: 'default' },
}, { timestamps: true });

assetLoanSchema.index({ asset: 1 });
assetLoanSchema.index({ borrower: 1 });
assetLoanSchema.index({ status: 1 });
assetLoanSchema.index({ tenantId: 1 });

const AssetLoan = mongoose.model('AssetLoan', assetLoanSchema);
const createTenantModelProxy = require('../middleware/tenantModelProxy');
module.exports = createTenantModelProxy('AssetLoan', AssetLoan);
