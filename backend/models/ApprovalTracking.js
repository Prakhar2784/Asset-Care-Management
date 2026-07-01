const mongoose = require('mongoose');

const approvalTrackingSchema = new mongoose.Schema({
  deviceRequest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DeviceRequest',
    required: true
  },
  workflow: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ApprovalWorkflow',
    required: true
  },
  currentStageIndex: {
    type: Number,
    default: 0
  },
  history: [{
    stageIndex: {
      type: Number,
      required: true
    },
    sequence: {
      type: Number,
      required: true
    },
    label: {
      type: String,
      required: true
    },
    assignedRole: {
      type: String,
      enum: ['hod', 'admin', 'it_support', 'super_admin'],
      required: true
    },
    action: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending'
    },
    remarks: {
      type: String,
      default: ''
    },
    actionedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    actionedAt: {
      type: Date,
      default: null
    }
  }],
  tenantId: {
    type: String,
    required: true,
    default: 'default'
  }
}, { timestamps: true });

approvalTrackingSchema.index({ tenantId: 1 });

const ApprovalTracking = mongoose.model('ApprovalTracking', approvalTrackingSchema);
const createTenantModelProxy = require('../middleware/tenantModelProxy');
module.exports = createTenantModelProxy('ApprovalTracking', ApprovalTracking);
