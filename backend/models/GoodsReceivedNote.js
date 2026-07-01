const mongoose = require('mongoose');

const goodsReceivedNoteSchema = new mongoose.Schema({
  grnNumber: { 
    type: String, 
    required: true 
  }, // e.g. "GRN-8001"
  purchaseOrder: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'PurchaseOrder', 
    required: true 
  },
  receivedDate: { 
    type: Date, 
    default: Date.now 
  },
  receivedItems: [{
    name: { type: String, required: true },
    quantityOrdered: { type: Number, required: true },
    quantityReceived: { type: Number, required: true, min: 0 },
    condition: { 
      type: String, 
      enum: ['Good', 'Damaged', 'Faulty'], 
      default: 'Good' 
    }
  }],
  receivedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  invoiceNumber: { 
    type: String,
    trim: true 
  },
  invoiceFileUrl: { 
    type: String, 
    default: null 
  }, // Local path to the uploaded PDF/image file
  status: { 
    type: String, 
    enum: ['Pending Asset Registration', 'Assets Registered'], 
    default: 'Pending Asset Registration' 
  },
  tenantId: { 
    type: String, 
    required: true, 
    default: 'default' 
  }
}, { 
  timestamps: true 
});

goodsReceivedNoteSchema.index({ tenantId: 1 });
goodsReceivedNoteSchema.index({ grnNumber: 1, tenantId: 1 }, { unique: true });

const GoodsReceivedNote = mongoose.model('GoodsReceivedNote', goodsReceivedNoteSchema);
const createTenantModelProxy = require('../middleware/tenantModelProxy');
module.exports = createTenantModelProxy('GoodsReceivedNote', GoodsReceivedNote);
