const mongoose = require('mongoose');
const DeviceRequest = require('../models/DeviceRequest');
const Asset = require('../models/Asset');
const AssetAssignment = require('../models/AssetAssignment');
const User = require('../models/User');
const ApprovalWorkflow = require('../models/ApprovalWorkflow');
const ApprovalTracking = require('../models/ApprovalTracking');
const {
  sendApprovalApprovedEmail,
  sendApprovalRejectedEmail
} = require('../services/emailService');
const { createNotification } = require('../services/notificationService');
const { audit } = require('../services/auditService');

// @route   POST /api/device-requests
// @access  Employee
const createRequest = async (req, res) => {
  try {
    const { requestType, itemRequested, reason, urgency, relatedAsset } = req.body;

    const requestId = `REQ-${Math.floor(10000 + Math.random() * 90000)}`;

    // Check for active workflow matching the requestType, or falling back to 'All'
    let matchingWorkflow = await ApprovalWorkflow.findOne({
      requestType,
      isActive: true
    });

    if (!matchingWorkflow) {
      matchingWorkflow = await ApprovalWorkflow.findOne({
        requestType: 'All',
        isActive: true
      });
    }

    let request;
    if (matchingWorkflow) {
      request = await DeviceRequest.create({
        requestId,
        requestType,
        itemRequested,
        reason,
        urgency: urgency || 'Medium',
        relatedAsset: relatedAsset || null,
        raisedBy: req.user._id,
        status: 'Under Review'
      });

      const history = matchingWorkflow.stages.map((stage, idx) => ({
        stageIndex: idx,
        sequence: stage.sequence,
        label: stage.label,
        assignedRole: stage.role,
        action: 'Pending',
        remarks: '',
        actionedBy: null,
        actionedAt: null
      }));

      await ApprovalTracking.create({
        deviceRequest: request._id,
        workflow: matchingWorkflow._id,
        currentStageIndex: 0,
        history,
        tenantId: req.tenantId || 'default'
      });

      // Notify the first stage approver(s)
      const firstStage = matchingWorkflow.stages[0];
      let query = { role: firstStage.role };
      if (firstStage.role === 'hod') {
        query.department = req.user.department;
      }

      User.find(query).then(approvers => {
        approvers.forEach(approver => {
          createNotification({
            userId: approver._id,
            type: 'system',
            title: 'Action Required: Device Request Approval',
            message: `${req.user.name} submitted request ${requestId} for "${itemRequested}" requiring your review.`,
            link: '/admin/approvals'
          });
        });
      }).catch(() => {});
    } else {
      // Default fallback when no workflow is configured
      request = await DeviceRequest.create({
        requestId,
        requestType,
        itemRequested,
        reason,
        urgency: urgency || 'Medium',
        relatedAsset: relatedAsset || null,
        raisedBy: req.user._id,
        status: 'Pending'
      });

      // Notify all admin-tier reviewers about the new device request
      User.find({ role: { $in: ['admin', 'super_admin', 'hod'] } }).then(admins => {
        admins.forEach(admin => {
          createNotification({
            userId: admin._id,
            type: 'system',
            title: 'New Device Request',
            message: `${req.user.name || 'An employee'} submitted device request ${requestId} for "${itemRequested}".`,
            link: '/admin/approvals'
          });
        });
      }).catch(() => {});
    }

    res.status(201).json(request);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @route   GET /api/device-requests
// @access  Admin
const getAllRequests = async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === 'hod' && req.user.department) {
      const deptUsers = await User.find({ department: req.user.department }).select('_id');
      filter.raisedBy = { $in: deptUsers.map(u => u._id) };
    }
    const requests = await DeviceRequest.find(filter)
      .populate('raisedBy', 'name email department')
      .populate('relatedAsset', 'name serialNumber')
      .populate('reviewedBy', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   GET /api/device-requests/mine
// @access  Employee
const getMyRequests = async (req, res) => {
  try {
    const requests = await DeviceRequest.find({ raisedBy: req.user._id })
      .populate('relatedAsset', 'name serialNumber')
      .populate('reviewedBy', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   GET /api/device-requests/my-approved
// @access  Employee (own approved requests)
const getMyApprovedRequests = async (req, res) => {
  try {
    const requests = await DeviceRequest.find({ raisedBy: req.user._id, status: 'Approved' })
      .populate('relatedAsset', 'name serialNumber')
      .sort({ updatedAt: -1 });
    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   PUT /api/device-requests/:id/review
// @access  Admin
const reviewRequest = async (req, res) => {
  try {
    const { status, adminRemarks, assetId } = req.body;

    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status must be Approved or Rejected' });
    }

    const request = await DeviceRequest.findById(req.params.id)
      .populate('raisedBy', 'name email department phone');

    if (!request) return res.status(404).json({ message: 'Request not found' });

    if (request.status !== 'Pending') {
      return res.status(400).json({ message: 'Request has already been reviewed' });
    }

    request.status = status;
    request.adminRemarks = adminRemarks || '';
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();

    // If approving and admin selected an asset, create the assignment immediately
    if (status === 'Approved' && assetId && mongoose.Types.ObjectId.isValid(assetId)) {
      const asset = await Asset.findById(assetId);
      if (asset && asset.assignedStatus !== 'Assigned') {
        const employee = request.raisedBy;

        await AssetAssignment.create({
          asset: asset._id,
          department: null,
          employeeName: employee.name,
          employeeEmail: employee.email,
          employeePhone: employee.phone || '',
          assignedDate: new Date(),
          assignedBy: req.user._id,
          status: 'Assigned'
        });

        const assignedUser = await User.findOne({ email: employee.email });
        await Asset.findByIdAndUpdate(asset._id, {
          assignedStatus: 'Assigned',
          assignedEmployeeName: employee.name,
          assignedEmployeeEmail: employee.email,
          assignedEmployeePhone: employee.phone || '',
          assignedDate: new Date(),
          assignedTo: assignedUser ? assignedUser._id : null,
        });

        request.assignedAsset = asset._id;
      }
    }

    const updated = await request.save();

    audit({ req, action: `request_${status.toLowerCase()}`, entity: 'device_request', entityId: request._id, entityLabel: request.requestId, changes: { status, adminRemarks: request.adminRemarks } });

    // Email + notification
    if (request.raisedBy) {
      if (status === 'Approved') {
        sendApprovalApprovedEmail(request.raisedBy, request).catch(() => {});
        createNotification({
          userId: request.raisedBy._id,
          type: 'request_approved',
          title: 'Device Request Approved',
          message: `Your request for "${request.itemRequested}" (${request.requestId}) has been approved.`,
          link: '/employee/portal'
        });

        // If no asset was assigned from inventory, alert all admins to add it to the registry
        if (!assetId) {
          User.find({ role: { $in: ['admin', 'super_admin'] } }).then(admins => {
            admins.forEach(admin => {
              createNotification({
                userId: admin._id,
                type: 'system',
                title: 'Asset Not In Registry',
                message: `Device request ${request.requestId} for "${request.itemRequested}" by ${request.raisedBy.name} was approved, but no inventory asset was assigned. Add the item to the Asset Registry and assign it.`,
                link: '/admin/assets'
              });
            });
          }).catch(() => {});
        }
      } else {
        sendApprovalRejectedEmail(request.raisedBy, request).catch(() => {});
        createNotification({
          userId: request.raisedBy._id,
          type: 'request_rejected',
          title: 'Device Request Rejected',
          message: `Your request for "${request.itemRequested}" (${request.requestId}) was not approved.${request.adminRemarks ? ' Reason: ' + request.adminRemarks : ''}`,
          link: '/employee/portal'
        });
      }
    }

    res.status(200).json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @route   PUT /api/device-requests/:id/workflow-action
// @access  Employee (matching workflow role)
const reviewWorkflowRequest = async (req, res) => {
  try {
    const { status, remarks, assetId } = req.body;

    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status must be Approved or Rejected' });
    }

    const request = await DeviceRequest.findById(req.params.id)
      .populate('raisedBy', 'name email department phone');

    if (!request) return res.status(404).json({ message: 'Request not found' });

    if (request.status !== 'Under Review') {
      return res.status(400).json({ message: 'Request is not under active workflow review' });
    }

    const tracking = await ApprovalTracking.findOne({ deviceRequest: request._id });
    if (!tracking) {
      return res.status(404).json({ message: 'Workflow tracking record not found' });
    }

    const currentStageIndex = tracking.currentStageIndex;
    const currentStage = tracking.history.find(h => h.stageIndex === currentStageIndex);

    if (!currentStage) {
      return res.status(400).json({ message: 'Active stage not found in workflow history' });
    }

    if (currentStage.action !== 'Pending') {
      return res.status(400).json({ message: 'Active stage has already been actioned' });
    }

    // Authorization check
    let isAuthorized = req.user.role === currentStage.assignedRole;
    if (currentStage.assignedRole === 'hod') {
      isAuthorized = req.user.role === 'hod' && req.user.department === request.raisedBy.department;
    }
    if (req.user.role === 'super_admin') {
      isAuthorized = true;
    }

    if (!isAuthorized) {
      return res.status(403).json({ message: `Not authorized. This stage requires the role: ${currentStage.assignedRole}` });
    }

    // Apply the action to the current stage
    currentStage.action = status;
    currentStage.remarks = remarks || '';
    currentStage.actionedBy = req.user._id;
    currentStage.actionedAt = new Date();

    if (status === 'Rejected') {
      // Reject the entire request
      request.status = 'Rejected';
      request.adminRemarks = remarks || `Rejected by ${currentStage.label}`;
      request.reviewedBy = req.user._id;
      request.reviewedAt = new Date();

      await tracking.save();
      const updated = await request.save();

      audit({ req, action: 'request_rejected', entity: 'device_request', entityId: request._id, entityLabel: request.requestId, changes: { status, remarks } });

      if (request.raisedBy) {
        sendApprovalRejectedEmail(request.raisedBy, request).catch(() => {});
        createNotification({
          userId: request.raisedBy._id,
          type: 'request_rejected',
          title: 'Device Request Rejected',
          message: `Your request for "${request.itemRequested}" (${request.requestId}) was rejected at stage "${currentStage.label}".${remarks ? ' Remarks: ' + remarks : ''}`,
          link: '/employee/portal'
        });
      }

      return res.status(200).json(updated);
    }

    // If status is Approved, check if it's the final stage
    const isFinalStage = currentStageIndex === tracking.history.length - 1;

    if (isFinalStage) {
      // Approve the entire request
      request.status = 'Approved';
      request.adminRemarks = remarks || 'Approved by all workflow stages';
      request.reviewedBy = req.user._id;
      request.reviewedAt = new Date();

      // Assign asset if provided
      if (assetId && mongoose.Types.ObjectId.isValid(assetId)) {
        const asset = await Asset.findById(assetId);
        if (asset && asset.assignedStatus !== 'Assigned') {
          const employee = request.raisedBy;

          await AssetAssignment.create({
            asset: asset._id,
            department: null,
            employeeName: employee.name,
            employeeEmail: employee.email,
            employeePhone: employee.phone || '',
            assignedDate: new Date(),
            assignedBy: req.user._id,
            status: 'Assigned'
          });

          const assignedUser = await User.findOne({ email: employee.email });
          await Asset.findByIdAndUpdate(asset._id, {
            assignedStatus: 'Assigned',
            assignedEmployeeName: employee.name,
            assignedEmployeeEmail: employee.email,
            assignedEmployeePhone: employee.phone || '',
            assignedDate: new Date(),
            assignedTo: assignedUser ? assignedUser._id : null,
          });

          request.assignedAsset = asset._id;
        }
      }

      await tracking.save();
      const updated = await request.save();

      audit({ req, action: 'request_approved', entity: 'device_request', entityId: request._id, entityLabel: request.requestId, changes: { status, remarks } });

      if (request.raisedBy) {
        sendApprovalApprovedEmail(request.raisedBy, request).catch(() => {});
        createNotification({
          userId: request.raisedBy._id,
          type: 'request_approved',
          title: 'Device Request Approved',
          message: `Your request for "${request.itemRequested}" (${request.requestId}) has been fully approved.`,
          link: '/employee/portal'
        });

        // Notify admins if no asset was assigned
        if (!assetId) {
          User.find({ role: { $in: ['admin', 'super_admin'] } }).then(admins => {
            admins.forEach(admin => {
              createNotification({
                userId: admin._id,
                type: 'system',
                title: 'Asset Not In Registry',
                message: `Device request ${request.requestId} for "${request.itemRequested}" by ${request.raisedBy.name} was approved, but no inventory asset was assigned. Add the item to the Asset Registry and assign it.`,
                link: '/admin/assets'
              });
            });
          }).catch(() => {});
        }
      }

      return res.status(200).json(updated);
    } else {
      // Move to next stage
      tracking.currentStageIndex = currentStageIndex + 1;
      await tracking.save();

      // Notify next stage approvers
      const nextStage = tracking.history[tracking.currentStageIndex];
      let query = { role: nextStage.assignedRole };
      if (nextStage.assignedRole === 'hod') {
        query.department = request.raisedBy.department;
      }

      User.find(query).then(approvers => {
        approvers.forEach(approver => {
          createNotification({
            userId: approver._id,
            type: 'system',
            title: 'Action Required: Device Request Approval',
            message: `${request.raisedBy.name} submitted request ${request.requestId} for "${request.itemRequested}" requiring your review (Stage: ${nextStage.label}).`,
            link: '/admin/approvals'
          });
        });
      }).catch(() => {});

      // Notify requester of progress
      createNotification({
        userId: request.raisedBy._id,
        type: 'request_update',
        title: 'Device Request Update',
        message: `Your request for "${request.itemRequested}" (${request.requestId}) passed stage "${currentStage.label}". Now pending: "${nextStage.label}".`,
        link: '/employee/portal'
      });

      return res.status(200).json(request);
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @route   GET /api/device-requests/:id/workflow-tracking
// @access  Employee (requester or admin)
const getWorkflowTracking = async (req, res) => {
  try {
    const tracking = await ApprovalTracking.findOne({ deviceRequest: req.params.id })
      .populate('workflow')
      .populate('history.actionedBy', 'name email role');
    
    if (!tracking) {
      return res.status(404).json({ message: 'No workflow tracking found for this request' });
    }
    
    res.status(200).json(tracking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   DELETE /api/device-requests/:id
// @access  Admin (any request) or the requester (own request, while still Pending/Under Review)
const deleteRequest = async (req, res) => {
  try {
    const request = await DeviceRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    const adminTier = ['admin', 'super_admin', 'hod', 'manager'];
    const isOwner = request.raisedBy.toString() === req.user._id.toString();

    if (!adminTier.includes(req.user.role) && !isOwner) {
      return res.status(403).json({ message: 'Not authorized to delete this request' });
    }

    if (isOwner && !adminTier.includes(req.user.role) && !['Pending', 'Under Review'].includes(request.status)) {
      return res.status(400).json({ message: 'Only pending requests can be withdrawn' });
    }

    await request.deleteOne();
    res.status(200).json({ message: 'Request deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createRequest,
  getAllRequests,
  getMyRequests,
  getMyApprovedRequests,
  reviewRequest,
  deleteRequest,
  reviewWorkflowRequest,
  getWorkflowTracking
};
