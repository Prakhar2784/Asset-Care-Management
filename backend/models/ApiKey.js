const mongoose = require('mongoose');

const apiKeySchema = new mongoose.Schema({
  name:       { type: String, required: true },
  keyHash:    { type: String, required: true },  // bcrypt hash (kept for reference)
  keyId:      { type: String, index: true },      // SHA-256 hex — used for fast O(1) lookup
  prefix:     { type: String, required: true },  // first 12 chars shown in UI
  lastUsed:   { type: Date, default: null },
  expiresAt:  { type: Date, default: null },
  scopes:     { type: [String], default: ['read'] },
  isActive:   { type: Boolean, default: true },
  createdBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  tenantId:   { type: String, required: true, default: 'default' },
}, { timestamps: true });

apiKeySchema.index({ tenantId: 1 });
apiKeySchema.index({ createdBy: 1 });

const ApiKey = mongoose.model('ApiKey', apiKeySchema);
const createTenantModelProxy = require('../middleware/tenantModelProxy');
module.exports = createTenantModelProxy('ApiKey', ApiKey);
