const mongoose = require('mongoose');

const discoveredDeviceSchema = new mongoose.Schema({
  scanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'NetworkScan',
    required: true
  },
  ipAddress: {
    type: String,
    required: true
  },
  macAddress: {
    type: String,
    required: true
  },
  hostname: {
    type: String,
    required: true
  },
  osType: {
    type: String,
    required: true
  },
  cpu: {
    type: String,
    required: true
  },
  ram: {
    type: Number, // GB
    required: true
  },
  storage: {
    type: Number, // GB
    required: true
  },
  status: {
    type: String,
    enum: ['Discovered', 'Imported', 'Ignored'],
    default: 'Discovered'
  },
  mappedAssetId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Asset',
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

discoveredDeviceSchema.index({ macAddress: 1, tenantId: 1 });
discoveredDeviceSchema.index({ tenantId: 1 });

const DiscoveredDevice = mongoose.model('DiscoveredDevice', discoveredDeviceSchema);
const createTenantModelProxy = require('../middleware/tenantModelProxy');
module.exports = createTenantModelProxy('DiscoveredDevice', DiscoveredDevice);
