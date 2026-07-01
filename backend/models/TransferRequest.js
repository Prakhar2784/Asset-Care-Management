const mongoose = require('mongoose');

const transferRequestSchema = new mongoose.Schema({
  asset: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Asset', 
    required: true 
  },
  fromUser: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  toUser: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['Pending HOD', 'Pending IT', 'Approved', 'Rejected'], 
    default: 'Pending HOD' 
  },
  managerRemarks: { 
    type: String, 
    trim: true 
  },
  itRemarks: { 
    type: String, 
    trim: true 
  },
  tenantId: { 
    type: String, 
    required: true, 
    default: 'default' 
  }
}, { 
  timestamps: true 
});

transferRequestSchema.index({ tenantId: 1 });
transferRequestSchema.index({ status: 1 });

const TransferRequest = mongoose.model('TransferRequest', transferRequestSchema);
const createTenantModelProxy = require('../middleware/tenantModelProxy');
module.exports = createTenantModelProxy('TransferRequest', TransferRequest);
