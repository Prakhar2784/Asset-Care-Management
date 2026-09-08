// backend/models/Coupon.js
const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  },
  description: {
    type: String,
    default: '',
    trim: true,
  },
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    required: true,
    default: 'fixed',
  },
  discountValue: {
    type: Number,
    required: true,
    min: 0,
  },
  minOrderValue: {
    type: Number,
    default: 0,
    min: 0,
  },
  maxDiscount: {
    type: Number,
    default: null,
  },
  applicablePlans: [{
    type: String,
    default: 'ALL',
  }],
  startDate: {
    type: Date,
    default: Date.now,
  },
  expiryDate: {
    type: Date,
    default: null,
  },
  maxUsage: {
    type: Number,
    default: null,
  },
  usageCount: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Coupon', couponSchema);
