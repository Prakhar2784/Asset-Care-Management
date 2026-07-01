const mongoose = require('mongoose');

const networkScanSchema = new mongoose.Schema({
  subnet: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['Scanning', 'Completed', 'Failed'],
    default: 'Scanning'
  },
  devicesFound: {
    type: Number,
    default: 0
  },
  scannedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tenantId: {
    type: String,
    required: true,
    default: 'default'
  }
}, {
  timestamps: true
});

networkScanSchema.index({ tenantId: 1 });

const NetworkScan = mongoose.model('NetworkScan', networkScanSchema);
const createTenantModelProxy = require('../middleware/tenantModelProxy');
module.exports = createTenantModelProxy('NetworkScan', NetworkScan);
