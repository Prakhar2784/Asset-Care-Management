const express = require('express');
const router = express.Router();
const {
  createRequest,
  getAllRequests,
  getMyRequests,
  getMyApprovedRequests,
  reviewRequest,
  deleteRequest,
  reviewWorkflowRequest,
  getWorkflowTracking
} = require('../controllers/deviceRequestController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Employee: view own requests
router.get('/mine', protect, getMyRequests);

// Employee: view own approved requests (for ticket raising)
router.get('/my-approved', protect, getMyApprovedRequests);

// Admin & Reviewers: view all requests
router.route('/')
  .get(protect, authorize('admin', 'super_admin', 'hod'), getAllRequests)
  .post(protect, createRequest);

// Workflow tracking for a request
router.get('/:id/workflow-tracking', protect, getWorkflowTracking);

// Sequential stage action (HOD, IT Support, Admin, Super Admin)
router.put('/:id/workflow-action', protect, reviewWorkflowRequest);

// Admin: approve or reject (non-workflow / direct admin actions)
router.put('/:id/review', protect, authorize('admin'), reviewRequest);

// Admin: delete any request. Employee: withdraw own pending request.
router.delete('/:id', protect, deleteRequest);

module.exports = router;
