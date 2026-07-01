const mongoose = require('mongoose');

const customFieldSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['Text', 'Number', 'Date', 'Select'],
    required: true
  },
  isRequired: {
    type: Boolean,
    default: false
  },
  options: {
    type: [String],
    default: []
  },
  tenantId: {
    type: String,
    required: true,
    default: 'default'
  }
}, {
  timestamps: true
});

// Indexes for query speed & uniqueness
customFieldSchema.index({ category: 1, tenantId: 1 });
customFieldSchema.index({ name: 1, category: 1, tenantId: 1 }, { unique: true });

const CustomField = mongoose.model('CustomField', customFieldSchema);
const createTenantModelProxy = require('../middleware/tenantModelProxy');
module.exports = createTenantModelProxy('CustomField', CustomField);
