const mongoose = require('mongoose');

const purchaseOrderSchema = new mongoose.Schema({
  poNumber: { 
    type: String, 
    required: true 
  }, // e.g. "PO-5001"
  purchaseRequest: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'PurchaseRequest', 
    default: null 
  },
  vendor: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Vendor', 
    required: true 
  },
  items: [{
    name: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    unitCost: { type: Number, required: true },
    totalCost: { type: Number, required: true }
  }],
  totalAmount: { 
    type: Number, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['Draft', 'Sent to Vendor', 'Accepted by Vendor', 'Rejected by Vendor', 'Partially Received', 'Completed', 'Cancelled'], 
    default: 'Draft' 
  },
  paymentStatus: { 
    type: String, 
    enum: ['Unpaid', 'Partially Paid', 'Paid'], 
    default: 'Unpaid' 
  },
  expectedDeliveryDate: { 
    type: Date 
  },
  terms: { 
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

purchaseOrderSchema.index({ tenantId: 1 });
purchaseOrderSchema.index({ poNumber: 1, tenantId: 1 }, { unique: true });

const PurchaseOrder = mongoose.model('PurchaseOrder', purchaseOrderSchema);
const createTenantModelProxy = require('../middleware/tenantModelProxy');
module.exports = createTenantModelProxy('PurchaseOrder', PurchaseOrder);
