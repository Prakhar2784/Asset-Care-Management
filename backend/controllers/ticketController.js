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
    const { issue, priority, assetId, deviceRequestId, itemLabel } = req.body;

    if (!assetId && !deviceRequestId) {
      return res.status(400).json({ message: 'Either an asset or an approved device request must be selected.' });
    }

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
      asset: assetId || null,
      deviceRequestRef: deviceRequestId || null,
      itemLabel: itemLabel || null,
      raisedBy: req.user._id,
      status: initialStatus,
      approvedBy: autoApprover
    });

    const populated = await Ticket.findById(ticket._id)
      .populate('asset', 'name serialNumber department')
      .populate('deviceRequestRef', 'requestId itemRequested requestType')
      .populate('raisedBy', 'name email department');

    // Fire-and-forget email + notification + audit
    sendTicketCreatedEmail(populated.raisedBy, populated, populated.asset)
      .catch(err => console.error('[TICKET EMAIL ERROR] Created:', err.message));
    audit({ req, action: 'ticket_created', entity: 'ticket', entityId: ticket._id, entityLabel: ticketId });

    // Notify the employee who raised the ticket
    createNotification({
      userId: req.user._id,
      type: 'ticket_created',
      title: 'Ticket Raised',
      message: `Your ticket ${ticketId} has been submitted${initialStatus === 'Vendor Assigned' ? ' and auto-approved' : ' and is pending approval'}.`,
      link: '/tickets'
    });

    // Notify all admin-tier reviewers about the new ticket
    const reviewerRoles = ['admin', 'super_admin', 'hod', 'it_support', 'manager'];
    if (!reviewerRoles.includes(req.user.role)) {
      User.find({ role: { $in: reviewerRoles } }).then(admins => {
        const itemName = populated.asset?.name || populated.itemLabel || ticketId;
        admins.forEach(admin => {
          createNotification({
            userId: admin._id,
            type: 'ticket_created',
            title: 'New Ticket Raised',
            message: `${populated.raisedBy?.name || 'An employee'} raised ticket ${ticketId} for "${itemName}".`,
            link: '/tickets'
          });
        });
      }).catch(() => {});
    }

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
      .populate('deviceRequestRef', 'requestId itemRequested requestType')
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
      .populate('deviceRequestRef', 'requestId itemRequested requestType')
      .populate('raisedBy', 'name email department')
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
    if (req.body.assignedVendor !== undefined) {
      ticket.assignedVendor = req.body.assignedVendor;
    }

    const updated = await ticket.save();

    audit({ req, action: 'ticket_status_changed', entity: 'ticket', entityId: ticket._id, entityLabel: ticket.ticketId, changes: { from: oldStatus, to: status } });

    // Email + notification to ticket raiser
    if (ticket.raisedBy) {
      if (status === 'Resolved') {
        sendTicketResolvedEmail(ticket.raisedBy, ticket, ticket.asset)
          .catch(err => console.error('[TICKET EMAIL ERROR] Resolved:', err.message));
        createNotification({
          userId: ticket.raisedBy._id,
          type: 'ticket_resolved',
          title: 'Ticket Resolved',
          message: `Your ticket ${ticket.ticketId} has been marked as Resolved.`,
          link: '/tickets'
        });
      } else if (status !== oldStatus) {
        sendTicketStatusEmail(ticket.raisedBy, ticket, ticket.asset, oldStatus)
          .catch(err => console.error('[TICKET EMAIL ERROR] Status:', err.message));
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

// @route   PUT /api/tickets/:id/confirm
// @access  Ticket raiser only, once repair is Resolved
const confirmResolution = async (req, res) => {
  try {
    const { remarks } = req.body;
    const ticket = await Ticket.findById(req.params.id).populate('raisedBy', 'name email');
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    if (ticket.raisedBy?._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the ticket raiser can confirm resolution.' });
    }
    if (ticket.status !== 'Resolved') {
      return res.status(400).json({ message: 'Ticket must be marked Resolved before it can be confirmed.' });
    }
    if (ticket.userConfirmed) {
      return res.status(400).json({ message: 'Resolution already confirmed.' });
    }

    ticket.userConfirmed = true;
    ticket.userConfirmedAt = new Date();
    if (remarks?.trim()) {
      ticket.comments.push({ text: `Resolution confirmed: ${remarks.trim()}`, author: req.user._id, authorName: req.user.name });
    }
    const updated = await ticket.save();

    audit({ req, action: 'ticket_resolution_confirmed', entity: 'ticket', entityId: ticket._id, entityLabel: ticket.ticketId });

    // Notify all admin-tier reviewers that the user has closed out this ticket
    const reviewerRoles = ['admin', 'super_admin', 'hod', 'it_support', 'manager'];
    User.find({ role: { $in: reviewerRoles } }).then(admins => {
      admins.forEach(admin => {
        createNotification({
          userId: admin._id,
          type: 'ticket_resolution_confirmed',
          title: 'Resolution Confirmed',
          message: `${ticket.raisedBy?.name || 'The user'} confirmed ticket ${ticket.ticketId} is resolved. It can now be closed.`,
          link: '/tickets'
        });
      });
    }).catch(() => {});

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

    const adminTier = ['admin', 'super_admin', 'hod', 'it_support', 'manager'];
    const isOwner = ticket.raisedBy?.toString() === req.user._id.toString();

    if (!adminTier.includes(req.user.role) && !isOwner) {
      return res.status(403).json({ message: 'Not authorized to delete this ticket' });
    }

    if (isOwner && !adminTier.includes(req.user.role) && ticket.status !== 'Pending Approval') {
      return res.status(400).json({ message: 'Only tickets pending approval can be withdrawn' });
    }

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
  confirmResolution,
  deleteTicket
};
