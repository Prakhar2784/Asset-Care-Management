const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: ['Hardware', 'Software', 'Network', 'Access', 'General'],
    required: true
  },
  views: {
    type: Number,
    default: 0
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isPublished: {
    type: Boolean,
    default: true
  },
  tenantId: {
    type: String,
    required: true,
    default: 'default'
  }
}, {
  timestamps: true
});

// Full-text search index
articleSchema.index({ title: 'text', content: 'text' });

// Filtering indexes
articleSchema.index({ category: 1, isPublished: 1, tenantId: 1 });
articleSchema.index({ tenantId: 1 });

const Article = mongoose.model('Article', articleSchema);
const createTenantModelProxy = require('../middleware/tenantModelProxy');
module.exports = createTenantModelProxy('Article', Article);
