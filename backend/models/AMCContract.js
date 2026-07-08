const mongoose = require('mongoose');

const amcContractSchema = new mongoose.Schema({
  contractNumber: { 
    type: String, 
    required: true 
  }, // e.g. "AMC-1002"
  vendor: {
    type: String,
    required: true
  },
  assetsCovered: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Asset' 
  }],
  startDate: { 
    type: Date, 
    required: true 
  },
  endDate: { 
    type: Date, 
    required: true 
  },
  annualCost: { 
    type: Number 
  },
  renewalAlertSent: { 
    type: Boolean, 
    default: false 
  },
  tenantId: { 
    type: String, 
    required: true, 
    default: 'default' 
  }
}, { 
  timestamps: true 
});

amcContractSchema.index({ tenantId: 1 });
amcContractSchema.index({ contractNumber: 1, tenantId: 1 }, { unique: true });

const AMCContract = mongoose.model('AMCContract', amcContractSchema);
const createTenantModelProxy = require('../middleware/tenantModelProxy');
module.exports = createTenantModelProxy('AMCContract', AMCContract);
