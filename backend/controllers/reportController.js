const Asset = require('../models/Asset');
const Ticket = require('../models/Ticket');
const DeviceRequest = require('../models/DeviceRequest');
const User = require('../models/User');

// GET /api/reports/summary
const getSummaryReport = async (req, res) => {
  try {
    const [totalAssets, totalTickets, totalRequests, totalUsers] = await Promise.all([
      Asset.countDocuments(),
      Ticket.countDocuments(),
      DeviceRequest.countDocuments(),
      User.countDocuments()
    ]);

    const [assetsByStatus, assetsByCategory, assetsByDept, ticketsByStatus, ticketsByPriority] = await Promise.all([
      Asset.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Asset.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]),
      Asset.aggregate([{ $group: { _id: '$department', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
      Ticket.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Ticket.aggregate([{ $group: { _id: '$priority', count: { $sum: 1 } } }]),
    ]);

    const warrantyExpiring30 = await Asset.countDocuments({
      warrantyEnd: {
        $gte: new Date(),
        $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    });

    res.json({
      totals: { assets: totalAssets, tickets: totalTickets, requests: totalRequests, users: totalUsers },
      assetsByStatus,
      assetsByCategory,
      assetsByDept,
      ticketsByStatus,
      ticketsByPriority,
      warrantyExpiring30
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/reports/assets — full asset list for export
const getAssetReport = async (req, res) => {
  try {
    const assets = await Asset.find({})
      .populate('assignedTo', 'name email department')
      .sort({ createdAt: -1 });
    res.json(assets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/reports/tickets — full ticket list for export
const getTicketReport = async (req, res) => {
  try {
    const tickets = await Ticket.find({})
      .populate('asset', 'name serialNumber department')
      .populate('raisedBy', 'name email department')
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getSummaryReport, getAssetReport, getTicketReport };
