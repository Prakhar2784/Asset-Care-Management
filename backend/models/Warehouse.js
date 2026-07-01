const mongoose = require('mongoose');

const warehouseSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  code: { 
    type: String, 
    required: true,
    trim: true,
    uppercase: true
  },
  location: { 
    type: String,
    trim: true 
  },
  manager: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    default: null
  },
  tenantId: { 
    type: String, 
    required: true, 
    default: 'default' 
  }
}, { 
  timestamps: true 
});

warehouseSchema.index({ tenantId: 1 });
warehouseSchema.index({ code: 1, tenantId: 1 }, { unique: true });

const Warehouse = mongoose.model('Warehouse', warehouseSchema);
const createTenantModelProxy = require('../middleware/tenantModelProxy');
module.exports = createTenantModelProxy('Warehouse', Warehouse);
