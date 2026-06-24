const mongoose = require('mongoose');
const DeviceRequest = require('../models/DeviceRequest');
const Asset = require('../models/Asset');
const AssetAssignment = require('../models/AssetAssignment');
const User = require('../models/User');
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

    const request = await DeviceRequest.create({
      requestId,
      requestType,
      itemRequested,
      reason,
      urgency: urgency || 'Medium',
      relatedAsset: relatedAsset || null,
      raisedBy: req.user._id
    });

    // Notify all admins about the new device request
    User.find({ role: 'admin' }).then(admins => {
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

    res.status(201).json(request);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @route   GET /api/device-requests
// @access  Admin
const getAllRequests = async (req, res) => {
  try {
    const requests = await DeviceRequest.find({})
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

// @route   DELETE /api/device-requests/:id
// @access  Admin
const deleteRequest = async (req, res) => {
  try {
    const request = await DeviceRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    await request.deleteOne();
    res.status(200).json({ message: 'Request deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createRequest, getAllRequests, getMyRequests, getMyApprovedRequests, reviewRequest, deleteRequest };
