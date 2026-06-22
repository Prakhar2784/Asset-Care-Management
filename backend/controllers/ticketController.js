const Ticket = require('../models/Ticket');

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

    res.status(201).json(ticket);
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

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    ticket.status = status;
    if (estimatedCost !== undefined) ticket.estimatedCost = estimatedCost;

    if (['Vendor Assigned', 'Under Repair'].includes(status)) {
      ticket.approvedBy = req.user._id;
    }

    const updated = await ticket.save();
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
