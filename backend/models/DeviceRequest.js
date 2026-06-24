const mongoose = require('mongoose');

const deviceRequestSchema = new mongoose.Schema({
  requestId: {
    type: String,
    required: true,
    unique: true
  },
  requestType: {
    type: String,
    enum: ['New Device', 'Replacement', 'Repair Authorization', 'Accessory'],
    required: true
  },
  itemRequested: {
    type: String,
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  urgency: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium'
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  },
  // The employee who raised the request
  raisedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // If replacement, link to the faulty asset
  relatedAsset: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Asset',
    default: null
  },
  // Admin who acted on it
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  reviewedAt: { type: Date },
  adminRemarks: { type: String },
  // Asset assigned to the employee when this request was approved
  assignedAsset: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Asset',
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('DeviceRequest', deviceRequestSchema);
