const DeviceRequest = require('../models/DeviceRequest');
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
    const { status, adminRemarks } = req.body;

    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status must be Approved or Rejected' });
    }

    const request = await DeviceRequest.findById(req.params.id)
      .populate('raisedBy', 'name email department');

    if (!request) return res.status(404).json({ message: 'Request not found' });

    if (request.status !== 'Pending') {
      return res.status(400).json({ message: 'Request has already been reviewed' });
    }

    request.status = status;
    request.adminRemarks = adminRemarks || '';
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();

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
