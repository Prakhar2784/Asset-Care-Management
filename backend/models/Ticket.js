const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  ticketId: { 
    type: String, 
    required: true
  }, // e.g., "SRV-089"
  issue: {
    type: String,
    required: true,
    trim: true,
    maxlength: [2000, 'Issue description cannot exceed 2000 characters.']
  },
  priority: { 
    type: String, 
    enum: ['Low', 'Medium', 'High', 'Critical'], 
    default: 'Medium' 
  },
  status: { 
    type: String, 
    enum: ['Pending HOD Approval', 'Pending Approval', 'Assigned to Technician', 'Service Center Required', 'Sent to Service Center', 'Vendor Assigned', 'Waiting Vendor', 'Waiting Parts', 'Under Repair', 'Resolved', 'Rejected'],
    default: 'Pending HOD Approval' 
  },
  estimatedCost: {
    type: Number,
    default: 0
  },
  userConfirmed: {
    type: Boolean,
    default: false
  },
  userConfirmedAt: {
    type: Date,
    default: null
  },

  // References to other collections
  asset: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Asset',
    default: null
  },
  assignedVendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    default: null
  },
  // Used when ticket is raised for an approved device request (not yet a formal asset)
  deviceRequestRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DeviceRequest',
    default: null
  },
  itemLabel: {
    type: String,
    default: null
  },
  raisedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  assignedTechnician: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  tenantId: {
    type: String,
    required: true,
    default: 'default'
  },

  // File attachments
  attachments: [{
    originalName: String,
    fileName:     String,
    url:          String,
    size:         Number,
    uploadedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    uploadedAt:   { type: Date, default: Date.now },
  }],

  // Recurring ticket support
  isRecurring:       { type: Boolean, default: false },
  recurringInterval: { type: String, enum: ['daily', 'weekly', 'monthly'], default: null },
  recurringNextDate: { type: Date, default: null },
  parentTicket:      { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket', default: null },

  // Comments / thread
  comments: [{
    text:      { type: String, required: true, trim: true, maxlength: [1000, 'Comment cannot exceed 1000 characters.'] },
    author:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    authorName: String,
    createdAt: { type: Date, default: Date.now },
  }],

  // SLA tracking fields — managed by slaEscalationJob.js
  slaDeadline: {
    type: Date,
    default: null
  },
  slaBreached: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for performance
ticketSchema.index({ status: 1 });
ticketSchema.index({ priority: 1 });
ticketSchema.index({ raisedBy: 1 });
ticketSchema.index({ createdAt: -1 });
ticketSchema.index({ tenantId: 1 });
ticketSchema.index({ ticketId: 1, tenantId: 1 }, { unique: true });
ticketSchema.index({ slaBreached: 1 });
ticketSchema.index({ slaDeadline: 1 });

const Ticket = mongoose.model('Ticket', ticketSchema);
const createTenantModelProxy = require('../middleware/tenantModelProxy');
module.exports = createTenantModelProxy('Ticket', Ticket);