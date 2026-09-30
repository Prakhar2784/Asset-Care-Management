const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true },
  tenantId: { type: mongoose.Schema.Types.Mixed, required: true, default: 'default' },
  date: { type: Date, default: Date.now },
  planName: { type: String },
  
  // Amounts
  baseAmount: { type: Number },
  prorationCredit: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  couponCode: { type: String, default: null },
  taxableAmount: { type: Number },
  addonAssets: { type: Number, default: 0 },
  isAddon: { type: Boolean, default: false },
  
  // Taxes
  cgst: { type: Number, default: 0 },
  sgst: { type: Number, default: 0 },
  igst: { type: Number, default: 0 },
  totalAmount: { type: Number },
  
  // Status & Gateway Info
  status: { type: String, default: 'Pending' },
  paymentReference: { type: String, default: null },
  razorpayOrderId: { type: String, default: null, index: true },
  razorpayPaymentId: { type: String, default: null },
  razorpaySignature: { type: String, default: null },
  currency: { type: String, default: 'INR' },

  // Customer snapshot at time of invoice
  customerName: { type: String },
  companyName: { type: String },
  address: { type: String },
  state: { type: String },
  city: { type: String },
  pin: { type: String },
  gstin: { type: String },
  
  // Subscription Period
  periodStart: { type: Date },
  periodEnd: { type: Date },

  // Vendor / Procurement Invoice fields (used in /admin/invoices)
  vendor: { type: String },
  vendorEmail: { type: String },
  vendorPhone: { type: String },
  amount: { type: Number },
  invoiceDate: { type: Date },
  dueDate: { type: Date },
  assets: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Asset' }],
  category: { type: String },
  notes: { type: String },
  fileUrl: { type: String },
  fileName: { type: String },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Invoice', invoiceSchema);