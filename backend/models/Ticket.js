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
    required: true 
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

module.exports = mongoose.model('Ticket', ticketSchema);