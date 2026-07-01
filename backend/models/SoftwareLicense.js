const mongoose = require('mongoose');

const softwareLicenseSchema = new mongoose.Schema({
  softwareName: { 
    type: String, 
    required: true,
    trim: true
  },
  publisher: { 
    type: String,
    trim: true
  },
  licenseKey: { 
    type: String, 
    required: true,
    trim: true
  },
  totalSeats: { 
    type: Number, 
    required: true, 
    min: 1,
    default: 1 
  },
  assignedSeats: { 
    type: Number, 
    default: 0 
  },
  assignments: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    assignedDate: { type: Date, default: Date.now }
  }],
  expiryDate: { 
    type: Date 
  },
  renewalCost: { 
    type: Number 
  },
  status: { 
    type: String, 
    enum: ['Active', 'Expired', 'Suspended'], 
    default: 'Active' 
  },
  tenantId: { 
    type: String, 
    required: true, 
    default: 'default' 
  }
}, { 
  timestamps: true 
});

softwareLicenseSchema.index({ tenantId: 1 });
softwareLicenseSchema.index({ softwareName: 1, tenantId: 1 });

const SoftwareLicense = mongoose.model('SoftwareLicense', softwareLicenseSchema);
const createTenantModelProxy = require('../middleware/tenantModelProxy');
module.exports = createTenantModelProxy('SoftwareLicense', SoftwareLicense);
