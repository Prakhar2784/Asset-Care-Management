const express = require('express');
const router = express.Router();
const {
  createTicket,
  getTickets,
  getMyTickets,
  updateTicketStatus,
  updateTicketPriority,
  deleteTicket
} = require('../controllers/ticketController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Must be before /:id to avoid route conflict
router.get('/mytickets', protect, getMyTickets);

router.route('/')
  .post(protect, createTicket)
  .get(protect, authorize('admin', 'hod'), getTickets);

router.route('/:id/status')
  .put(protect, authorize('admin', 'hod'), updateTicketStatus);

router.route('/:id/priority')
  .put(protect, authorize('admin', 'hod'), updateTicketPriority);

router.route('/:id')
  .delete(protect, authorize('admin'), deleteTicket);

module.exports = router;
