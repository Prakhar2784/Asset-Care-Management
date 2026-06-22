// backend/controllers/dashboardController.js
const Asset = require('../models/Asset');
const Ticket = require('../models/Ticket');

// @desc    Get dashboard analytics and statistics
// @route   GET /api/dashboard/stats
// @access  Private (Admin / HOD)
const getDashboardStats = async (req, res) => {
  try {
    // 1. Get total counts
    const totalAssets = await Asset.countDocuments();
    const totalTickets = await Ticket.countDocuments();

    // 2. Get ticket breakdowns by status
    const pendingTickets = await Ticket.countDocuments({ status: 'Pending Approval' });
    const activeRepairs = await Ticket.countDocuments({ 
      status: { $in: ['Vendor Assigned', 'Under Repair'] } 
    });
    const resolvedTickets = await Ticket.countDocuments({ status: 'Resolved' });

    // 3. Get the 5 most recent tickets for the activity feed
    const recentTickets = await Ticket.find({})
      .sort({ createdAt: -1 }) // Sort by newest first
      .limit(5)
      .populate('asset', 'name ticketId');

    // 4. Send the aggregated data back to the frontend
    res.status(200).json({
      totalAssets,
      totalTickets,
      pendingTickets,
      activeRepairs,
      resolvedTickets,
      recentTickets
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getDashboardStats
};