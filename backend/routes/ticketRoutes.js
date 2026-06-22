// backend/routes/ticketRoutes.js
const express = require('express');
const router = express.Router();
const { 
  createTicket, 
  getTickets, 
  updateTicketStatus,
  deleteTicket // <-- 1. Import the delete function
} = require('../controllers/ticketController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Base routes: /api/tickets
router.route('/')
  .post(protect, createTicket) 
  .get(protect, authorize('admin', 'hod'), getTickets);

// Status update route: /api/tickets/:id/status
router.route('/:id/status')
  .put(protect, authorize('admin', 'hod'), updateTicketStatus);

// NEW: Delete route: /api/tickets/:id
// We use authorize('admin') here so only full admins can permanently delete records
router.route('/:id')
  .delete(protect, authorize('admin'), deleteTicket); 

module.exports = router;