const mongoose = require('mongoose');

const purchaseRequestSchema = new mongoose.Schema({
  prNumber: { 
    type: String, 
    required: true 
  }, // e.g. "PR-1002"
  itemName: { 
    type: String, 
    required: true,
    trim: true
  },
  category: { 
    type: String, 
    required: true 
  },
  quantity: { 
    type: Number, 
    required: true, 
    min: 1 
  },
  estimatedUnitCost: { 
    type: Number, 
    required: true 
  },
  totalCost: { 
    type: Number, 
    required: true 
  },
  justification: { 
    type: String, 
    required: true,
    trim: true
  },
  status: { 
    type: String, 
    enum: ['Pending Approval', 'Approved', 'Rejected', 'PO Created'], 
    default: 'Pending Approval' 
  },
  requestedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  reviewedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    default: null 
  },
  reviewedAt: { 
    type: Date, 
    default: null 
  },
  remarks: { 
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

purchaseRequestSchema.index({ tenantId: 1 });
purchaseRequestSchema.index({ prNumber: 1, tenantId: 1 }, { unique: true });

const PurchaseRequest = mongoose.model('PurchaseRequest', purchaseRequestSchema);
const createTenantModelProxy = require('../middleware/tenantModelProxy');
module.exports = createTenantModelProxy('PurchaseRequest', PurchaseRequest);
