const express = require('express');
const router  = express.Router();
const Ticket  = require('../models/Ticket');
const {
  createTicket, getTickets, getMyTickets,
  updateTicketStatus, updateTicketPriority, confirmResolution, deleteTicket
} = require('../controllers/ticketController');
const { protect, requirePermission } = require('../middleware/authMiddleware');
const { attachmentUpload } = require('../middleware/upload');

// Must be before /:id to avoid route conflict
router.get('/mytickets', protect, getMyTickets);

router.route('/')
  .post(protect, createTicket)
  .get(protect, requirePermission('Raise Tickets', 'Manage All Tickets'), getTickets);

router.route('/:id/status')
  .put(protect, requirePermission('Manage All Tickets', 'Raise Tickets'), updateTicketStatus);

router.route('/:id/priority')
  .put(protect, requirePermission('Manage All Tickets', 'Raise Tickets'), updateTicketPriority);

// Ticket raiser confirms the repair is actually resolved
router.put('/:id/confirm', protect, confirmResolution);

// POST /api/tickets/:id/attachments — upload files
router.post('/:id/attachments', protect, attachmentUpload, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found.' });
    if (!req.files || req.files.length === 0)
      return res.status(400).json({ message: 'No files uploaded.' });

    const newAttachments = req.files.map(f => ({
      originalName: f.originalname,
      fileName:     f.filename,
      url:          `/uploads/attachments/${f.filename}`,
      size:         f.size,
      uploadedBy:   req.user._id,
    }));
    ticket.attachments.push(...newAttachments);
    await ticket.save();
    res.json(ticket.attachments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/tickets/:id/attachments/:attId
router.delete('/:id/attachments/:attId', protect, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found.' });
    ticket.attachments = ticket.attachments.filter(a => a._id.toString() !== req.params.attId);
    await ticket.save();
    res.json({ message: 'Attachment removed.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/tickets/:id/comments
router.post('/:id/comments', protect, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: 'Comment text is required.' });
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found.' });

    ticket.comments.push({ text: text.trim(), author: req.user._id, authorName: req.user.name });
    await ticket.save();

    const populated = await Ticket.findById(ticket._id)
      .populate('comments.author', 'name avatar');
    res.json(populated.comments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/tickets/:id — full ticket detail
router.get('/:id', protect, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('asset', 'name serialNumber department')
      .populate('raisedBy', 'name email department avatar')
      .populate('approvedBy', 'name')
      .populate('assignedVendor', 'name email')
      .populate('comments.author', 'name avatar');
    if (!ticket) return res.status(404).json({ message: 'Ticket not found.' });
    res.json(ticket);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.route('/:id')
  .delete(protect, deleteTicket);

module.exports = router;
