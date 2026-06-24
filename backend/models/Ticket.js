const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  ticketId: { 
    type: String, 
    required: true, 
    unique: true 
  }, // e.g., "SRV-089"
  issue: { 
    type: String, 
    required: true 
  },
  priority: { 
    type: String, 
    enum: ['Low', 'Medium', 'High', 'Critical'], 
    default: 'Medium' 
  },
  status: { 
    type: String, 
    enum: ['Pending Approval', 'Vendor Assigned', 'Under Repair', 'Resolved', 'Rejected'], 
    default: 'Pending Approval' 
  },
  estimatedCost: { 
    type: Number, 
    default: 0 
  },
  
  // References to other collections
  asset: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Asset',
    default: null
  },
  // Used when ticket is raised for an approved device request (not yet a formal asset)
  deviceRequestRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DeviceRequest',
    default: null
  },
  itemLabel: {
    type: String,
    default: null
  },
  raisedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true
});

// Indexes for performance
ticketSchema.index({ status: 1 });
ticketSchema.index({ priority: 1 });
ticketSchema.index({ raisedBy: 1 });
ticketSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Ticket', ticketSchema);