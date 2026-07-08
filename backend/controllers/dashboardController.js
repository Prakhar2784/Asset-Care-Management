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

    // For HODs, filter maintenance to their department's assets only
    let maintenanceAssetFilter = {};
    if (req.user.role === 'hod' && req.user.department) {
      const deptAssets = await Asset.find({ department: req.user.department, isDeleted: { $ne: true } }).select('_id');
      maintenanceAssetFilter = { asset: { $in: deptAssets.map(a => a._id) } };
    }

    const [assets, tickets, byServiceDate, byNextServiceDate] = await Promise.all([
      Asset.find({
        isDeleted: { $ne: true },
        procurementDate: { $gte: startOfDay, $lte: endOfDay }
      }).select('name serialNumber category department'),
      Ticket.find({
        createdAt: { $gte: startOfDay, $lte: endOfDay }
      }).select('ticketId issue status priority')
        .populate('asset', 'name'),
      MaintenanceLog.find({
        serviceDate: { $gte: startOfDay, $lte: endOfDay },
        ...maintenanceAssetFilter,
      }).select('type description status cost nextServiceDate')
        .populate('asset', 'name department'),
      MaintenanceLog.find({
        nextServiceDate: { $gte: startOfDay, $lte: endOfDay },
        ...maintenanceAssetFilter,
      }).select('type description status cost nextServiceDate')
        .populate('asset', 'name department'),
    ]);

    // Merge, de-duplicate by _id
    const seen = new Set(byServiceDate.map(m => m._id.toString()));
    const merged = [
      ...byServiceDate,
      ...byNextServiceDate.filter(m => !seen.has(m._id.toString())),
    ];

    res.status(200).json({
      assets,
      tickets,
      maintenance: merged,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   GET /api/dashboard/scheduled-maintenance
// @access  Protected
// Returns all upcoming scheduled maintenance dates (for calendar dot display).
// HODs receive only their department's maintenance; admins receive all.
const getScheduledMaintenance = async (req, res) => {
  try {
    let assetFilter = { isDeleted: { $ne: true } };
    if (req.user.role === 'hod' && req.user.department) {
      assetFilter.department = req.user.department;
    }

    const eligibleAssets = await Asset.find(assetFilter).select('_id');
    const assetIds = eligibleAssets.map(a => a._id);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Upcoming scheduled service dates (today or future, status = Scheduled)
    const scheduledLogs = await MaintenanceLog.find({
      status: 'Scheduled',
      serviceDate: { $gte: today },
      asset: { $in: assetIds },
    }).select('serviceDate description type asset')
      .populate('asset', 'name department');

    // Future next-service-date entries from any log
    const nextServiceLogs = await MaintenanceLog.find({
      nextServiceDate: { $gte: today },
      asset: { $in: assetIds },
    }).select('nextServiceDate description type asset')
      .populate('asset', 'name department');

    const datesMap = new Map();

    scheduledLogs.forEach(log => {
      const date = log.serviceDate.toISOString().split('T')[0];
      datesMap.set(`${date}-${log._id}`, {
        date,
        description: log.description,
        type: log.type,
        assetName: log.asset?.name,
        department: log.asset?.department,
      });
    });

    nextServiceLogs.forEach(log => {
      const date = new Date(log.nextServiceDate).toISOString().split('T')[0];
      datesMap.set(`next-${date}-${log._id}`, {
        date,
        description: log.description || 'Scheduled Next Service',
        type: log.type,
        assetName: log.asset?.name,
        department: log.asset?.department,
      });
    });

    const dates = Array.from(datesMap.values());

    res.status(200).json({ dates });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getDashboardStats, getDateHistory, getScheduledMaintenance };
