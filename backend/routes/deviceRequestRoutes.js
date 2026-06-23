const express = require('express');
const router = express.Router();
const {
  createRequest,
  getAllRequests,
  getMyRequests,
  getMyApprovedRequests,
  reviewRequest,
  deleteRequest
} = require('../controllers/deviceRequestController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Employee: view own requests
router.get('/mine', protect, getMyRequests);

// Employee: view own approved requests (for ticket raising)
router.get('/my-approved', protect, getMyApprovedRequests);

// Admin: view all requests
router.route('/')
  .get(protect, authorize('admin'), getAllRequests)
  .post(protect, createRequest);

// Admin: approve or reject
router.put('/:id/review', protect, authorize('admin'), reviewRequest);

// Admin: delete
router.delete('/:id', protect, authorize('admin'), deleteRequest);

module.exports = router;
