const mongoose = require('mongoose');

const subscriptionHistorySchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  action: { type: String, enum: ['Subscribed', 'Upgraded', 'Downgraded', 'Renewed', 'Cancelled', 'Downgrade Scheduled', 'Downgrade Cancelled'], required: true },
  date: { type: Date, default: Date.now },
  previousPlan: { type: String, default: null },
  newPlan: { type: String, required: true },
  amountPaid: { type: Number, default: 0 },
  paymentReference: { type: String, default: null },
  notes: { type: String, default: null }
}, { timestamps: true });

module.exports = mongoose.model('SubscriptionHistory', subscriptionHistorySchema);