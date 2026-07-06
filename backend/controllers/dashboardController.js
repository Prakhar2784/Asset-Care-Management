const Asset = require('../models/Asset');
const Ticket = require('../models/Ticket');
const DeviceRequest = require('../models/DeviceRequest');
const MaintenanceLog = require('../models/MaintenanceLog');

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

// @route   GET /api/dashboard/date-history
// @access  Protected
const getDateHistory = async (req, res) => {
  try {
    const { date } = req.query; // YYYY-MM-DD format
    if (!date) {
      return res.status(400).json({ message: 'Date parameter is required.' });
    }

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const [assets, tickets, maintenance] = await Promise.all([
      Asset.find({
        isDeleted: { $ne: true },
        procurementDate: { $gte: startOfDay, $lte: endOfDay }
      }).select('name serialNumber category department'),
      Ticket.find({
        createdAt: { $gte: startOfDay, $lte: endOfDay }
      }).select('ticketId issue status priority')
        .populate('asset', 'name'),
      MaintenanceLog.find({
        serviceDate: { $gte: startOfDay, $lte: endOfDay }
      }).select('type description status cost')
        .populate('asset', 'name')
    ]);

    res.status(200).json({
      assets,
      tickets,
      maintenance
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getDashboardStats, getDateHistory };
