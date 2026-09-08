const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true, unique: true },
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  date: { type: Date, default: Date.now },
  planName: { type: String, required: true },
  
  // Amounts
  baseAmount: { type: Number, required: true },
  discountAmount: { type: Number, default: 0 },
  couponCode: { type: String, default: null },
  taxableAmount: { type: Number, required: true },
  
  // Taxes
  cgst: { type: Number, default: 0 },
  sgst: { type: Number, default: 0 },
  igst: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  
  // Status & Gateway Info
  status: { type: String, enum: ['Paid', 'Pending', 'Failed', 'Refunded'], default: 'Pending' },
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
  periodStart: { type: Date, required: true },
  periodEnd: { type: Date, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Invoice', invoiceSchema);