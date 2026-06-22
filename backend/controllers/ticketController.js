// backend/controllers/ticketController.js
const Ticket = require('../models/Ticket');

// @desc    Raise a new breakdown ticket
// @route   POST /api/tickets
// @access  Private
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
      priority,
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

// @desc    Get all tickets
// @route   GET /api/tickets
// @access  Private (Admin / HOD)
const getTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find({})
      .populate('asset', 'name serialNumber department')
      .populate('raisedBy', 'name department role')
      .populate('approvedBy', 'name'); 
    
    res.status(200).json(tickets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update ticket status
// @route   PUT /api/tickets/:id/status
// @access  Private (Admin / HOD)
const updateTicketStatus = async (req, res) => {
  try {
    const { status, estimatedCost } = req.body;
    
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    ticket.status = status;
    if (estimatedCost) ticket.estimatedCost = estimatedCost;
    
    if (status === 'Vendor Assigned' || status === 'Under Repair') {
      ticket.approvedBy = req.user._id;
    }

    const updatedTicket = await ticket.save();
    res.status(200).json(updatedTicket);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// NEW: @desc    Delete a ticket
// @route   DELETE /api/tickets/:id
// @access  Private (Admin only)
const deleteTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    await ticket.deleteOne(); // Removes the ticket from MongoDB
    res.status(200).json({ message: 'Ticket removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createTicket,
  getTickets,
  updateTicketStatus,
  deleteTicket // Export the new function
};