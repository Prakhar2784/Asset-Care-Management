const Ticket = require('../models/Ticket');
const User = require('../models/User');
const {
  sendTicketCreatedEmail,
  sendTicketStatusEmail,
  sendTicketResolvedEmail
} = require('../services/emailService');
const { createNotification } = require('../services/notificationService');
const { audit } = require('../services/auditService');

// @route   POST /api/tickets
// @access  Private (any logged-in user)
const createTicket = async (req, res) => {
  try {
    const { issue, priority, assetId } = req.body;

    const ticketId = `SRV-${Math.floor(10000 + Math.random() * 90000)}`;

    let initialStatus = 'Pending Approval';
    let autoApprover = null;

    if (req.user.role === 'admin' || req.user.role === 'hod') {
      initialStatus = 'Vendor Assigned';
      autoApprover = req.user._id;
    }

    const ticket = await Ticket.create({
      ticketId,
      issue,
      priority: priority || 'Medium',
      asset: assetId,
      raisedBy: req.user._id,
      status: initialStatus,
      approvedBy: autoApprover
    });

    const populated = await Ticket.findById(ticket._id)
      .populate('asset', 'name serialNumber department')
      .populate('raisedBy', 'name email department');

    // Fire-and-forget email + notification + audit
    sendTicketCreatedEmail(populated.raisedBy, populated, populated.asset).catch(() => {});
    audit({ req, action: 'ticket_created', entity: 'ticket', entityId: ticket._id, entityLabel: ticketId });
    createNotification({
      userId: req.user._id,
      type: 'ticket_created',
      title: 'Ticket Raised',
      message: `Your ticket ${ticketId} has been submitted${initialStatus === 'Vendor Assigned' ? ' and auto-approved' : ' and is pending approval'}.`,
      link: '/tickets'
    });

    res.status(201).json(populated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @route   GET /api/tickets
// @access  Admin / HOD
const getTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find({})
      .populate('asset', 'name serialNumber department')
      .populate('raisedBy', 'name department role')
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json(tickets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   GET /api/tickets/mytickets
// @access  Employee (own tickets only)
const getMyTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find({ raisedBy: req.user._id })
      .populate('asset', 'name serialNumber department')
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json(tickets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   PUT /api/tickets/:id/status
// @access  Admin / HOD
const updateTicketStatus = async (req, res) => {
  try {
    const { status, estimatedCost } = req.body;

    const ticket = await Ticket.findById(req.params.id)
      .populate('raisedBy', 'name email department')
      .populate('asset', 'name serialNumber department');

    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    const oldStatus = ticket.status;
    ticket.status = status;
    if (estimatedCost !== undefined) ticket.estimatedCost = estimatedCost;

    if (['Vendor Assigned', 'Under Repair'].includes(status)) {
      ticket.approvedBy = req.user._id;
    }

    const updated = await ticket.save();

    audit({ req, action: 'ticket_status_changed', entity: 'ticket', entityId: ticket._id, entityLabel: ticket.ticketId, changes: { from: oldStatus, to: status } });

    // Email + notification to ticket raiser
    if (ticket.raisedBy) {
      if (status === 'Resolved') {
        sendTicketResolvedEmail(ticket.raisedBy, ticket, ticket.asset).catch(() => {});
        createNotification({
          userId: ticket.raisedBy._id,
          type: 'ticket_resolved',
          title: 'Ticket Resolved',
          message: `Your ticket ${ticket.ticketId} has been marked as Resolved.`,
          link: '/tickets'
        });
      } else if (status !== oldStatus) {
        sendTicketStatusEmail(ticket.raisedBy, ticket, ticket.asset, oldStatus).catch(() => {});
        createNotification({
          userId: ticket.raisedBy._id,
          type: 'ticket_status',
          title: 'Ticket Status Updated',
          message: `Your ticket ${ticket.ticketId} status changed from ${oldStatus} to ${status}.`,
          link: '/tickets'
        });
      }
    }

    res.status(200).json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @route   PUT /api/tickets/:id/priority
// @access  Admin / HOD
const updateTicketPriority = async (req, res) => {
  try {
    const { priority } = req.body;

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    ticket.priority = priority;
    const updated = await ticket.save();
    res.status(200).json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @route   DELETE /api/tickets/:id
// @access  Admin
const deleteTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    await ticket.deleteOne();
    res.status(200).json({ message: 'Ticket removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createTicket,
  getTickets,
  getMyTickets,
  updateTicketStatus,
  updateTicketPriority,
  deleteTicket
};
