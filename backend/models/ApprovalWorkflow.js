const mongoose = require('mongoose');

const approvalWorkflowSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  requestType: {
    type: String,
    enum: ['New Device', 'Replacement', 'Repair Authorization', 'Accessory', 'All'],
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  stages: [{
    sequence: {
      type: Number,
      required: true
    },
    label: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ['hod', 'admin', 'it_support', 'super_admin'],
      required: true
    }
  }],
  tenantId: {
    type: String,
    required: true,
    default: 'default'
  }
}, { timestamps: true });

approvalWorkflowSchema.index({ tenantId: 1 });

const ApprovalWorkflow = mongoose.model('ApprovalWorkflow', approvalWorkflowSchema);
const createTenantModelProxy = require('../middleware/tenantModelProxy');
module.exports = createTenantModelProxy('ApprovalWorkflow', ApprovalWorkflow);
