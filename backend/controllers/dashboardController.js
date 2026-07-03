const Asset = require('../models/Asset');
const Ticket = require('../models/Ticket');
const DeviceRequest = require('../models/DeviceRequest');

// @route   GET /api/dashboard/stats
// @access  Admin / HOD
const getDashboardStats = async (req, res) => {
  try {
    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const [
      totalAssets,
      totalTickets,
      pendingTickets,
      activeRepairs,
      resolvedTickets,
      warrantyExpiringSoon,
      pendingRequests,
      recentTickets,
      departmentBreakdown
    ] = await Promise.all([
      Asset.countDocuments({ isDeleted: { $ne: true } }),
      Ticket.countDocuments(),
      Ticket.countDocuments({ status: 'Pending Approval' }),
      Ticket.countDocuments({ status: { $in: ['Vendor Assigned', 'Waiting Vendor', 'Waiting Parts', 'Under Repair'] } }),
      Ticket.countDocuments({ status: 'Resolved' }),
      // Counts assets already past warranty as well as those expiring within 30 days
      Asset.countDocuments({ isDeleted: { $ne: true }, warrantyEnd: { $ne: null, $lte: in30Days } }),
      DeviceRequest.countDocuments({ status: 'Pending' }),
      Ticket.find({})
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('asset', 'name department')
        .populate('raisedBy', 'name'),
      Asset.aggregate([
        { $match: { isDeleted: { $ne: true } } },
        { $group: { _id: '$department', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 6 }
      ])
    ]);

    res.status(200).json({
      totalAssets,
      totalTickets,
      pendingTickets,
      activeRepairs,
      resolvedTickets,
      warrantyExpiringSoon,
      pendingRequests,
      recentTickets,
      departmentBreakdown
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getDashboardStats };
