const mongoose = require('mongoose');

const warrantyClaimSchema = new mongoose.Schema({
  claimNumber: { 
    type: String, 
    required: true 
  }, // e.g. "CLM-3012"
  asset: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Asset', 
    required: true 
  },
  vendor: {
    type: String,
    required: true
  },
  issueDescription: { 
    type: String, 
    required: true,
    trim: true
  },
  status: { 
    type: String, 
    enum: ['Filed', 'In Review', 'Resolved', 'Rejected'], 
    default: 'Filed' 
  },
  resolutionDetails: { 
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

warrantyClaimSchema.index({ tenantId: 1 });
warrantyClaimSchema.index({ claimNumber: 1, tenantId: 1 }, { unique: true });

const WarrantyClaim = mongoose.model('WarrantyClaim', warrantyClaimSchema);
const createTenantModelProxy = require('../middleware/tenantModelProxy');
module.exports = createTenantModelProxy('WarrantyClaim', WarrantyClaim);
