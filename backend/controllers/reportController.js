const Asset = require('../models/Asset');
const Ticket = require('../models/Ticket');
const DeviceRequest = require('../models/DeviceRequest');
const User = require('../models/User');
const { getHodScope } = require('../utils/hodScope');

const buildHodScopeFilters = async (user) => {
  if (user.role !== 'hod' || !user.department) return {
    assetFilter: { isDeleted: { $ne: true } },
    ticketFilter: {}, userFilter: {}, requestFilter: {},
  };
  const { deptUserIds, deptAssetIds } = await getHodScope(user);
  const dept = user.department;
  return {
    assetFilter: { isDeleted: { $ne: true }, department: dept },
    ticketFilter: { $or: [{ raisedBy: { $in: deptUserIds } }, { asset: { $in: deptAssetIds } }] },
    userFilter: { department: dept },
    requestFilter: { raisedBy: { $in: deptUserIds } },
    deptUserIds, deptAssetIds,
  };
};

// GET /api/reports/summary
const getSummaryReport = async (req, res) => {
  try {
    const { assetFilter, ticketFilter, userFilter, requestFilter } = await buildHodScopeFilters(req.user);

    const [totalAssets, totalTickets, totalRequests, totalUsers] = await Promise.all([
      Asset.countDocuments(assetFilter),
      Ticket.countDocuments(ticketFilter),
      DeviceRequest.countDocuments(requestFilter),
      User.countDocuments(userFilter),
    ]);

    const [assetsByStatus, assetsByCategory, assetsByDept, ticketsByStatus, ticketsByPriority] = await Promise.all([
      Asset.aggregate([{ $match: assetFilter }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
      Asset.aggregate([{ $match: assetFilter }, { $group: { _id: '$category', count: { $sum: 1 } } }]),
      Asset.aggregate([{ $match: assetFilter }, { $group: { _id: '$department', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
      Ticket.aggregate([{ $match: ticketFilter }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
      Ticket.aggregate([{ $match: ticketFilter }, { $group: { _id: '$priority', count: { $sum: 1 } } }]),
    ]);

    const warrantyExpiring30 = await Asset.countDocuments({
      ...assetFilter,
      warrantyEnd: {
        $gte: new Date(),
        $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
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
    const { assetFilter } = await buildHodScopeFilters(req.user);
    const assets = await Asset.find(assetFilter)
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
    const { ticketFilter } = await buildHodScopeFilters(req.user);
    const tickets = await Ticket.find(ticketFilter)
      .populate('asset', 'name serialNumber department')
      .populate('raisedBy', 'name email department')
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/reports/lifecycle — full ticket lifecycle report for download
const getLifecycleReport = async (req, res) => {
  try {
    const { ticketFilter } = await buildHodScopeFilters(req.user);
    const { status, priority, from, to } = req.query;
    const filter = { ...ticketFilter };
    if (status && status !== 'All') filter.status = status;
    if (priority && priority !== 'All') filter.priority = priority;
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(new Date(to).setHours(23, 59, 59, 999));
    }

    const tickets = await Ticket.find(filter)
      .populate('asset', 'name serialNumber category department location vendor modelNumber purchaseCost warrantyEnd')
      .populate('raisedBy', 'name email department role phone')
      .populate('approvedBy', 'name email role')
      .populate('deviceRequestRef', 'requestId itemRequested requestType')
      .sort({ createdAt: -1 });

    const rows = tickets.map(t => {
      const raisedAt = new Date(t.createdAt);
      const updatedAt = new Date(t.updatedAt);
      const resolutionHours = t.status === 'Resolved'
        ? Math.round((updatedAt - raisedAt) / 36e5 * 10) / 10
        : null;

      return {
        ticketId: t.ticketId,
        status: t.status,
        priority: t.priority,
        issue: t.issue,
        estimatedCost: t.estimatedCost || 0,
        raisedAt: raisedAt.toLocaleString('en-IN'),
        lastUpdated: updatedAt.toLocaleString('en-IN'),
        resolutionHours,
        assetName: t.asset?.name || t.itemLabel || t.deviceRequestRef?.itemRequested || 'N/A',
        assetSerial: t.asset?.serialNumber || 'N/A',
        assetCategory: t.asset?.category || 'N/A',
        assetDepartment: t.asset?.department || 'N/A',
        assetLocation: t.asset?.location || 'N/A',
        assetVendor: t.asset?.vendor || 'N/A',
        assetPurchaseCost: t.asset?.purchaseCost || 'N/A',
        assetWarrantyEnd: t.asset?.warrantyEnd ? new Date(t.asset.warrantyEnd).toLocaleDateString('en-IN') : 'N/A',
        raisedByName: t.raisedBy?.name || 'N/A',
        raisedByEmail: t.raisedBy?.email || 'N/A',
        raisedByDept: t.raisedBy?.department || 'N/A',
        raisedByRole: t.raisedBy?.role || 'N/A',
        approvedByName: t.approvedBy?.name || 'Pending',
      };
    });

    const summary = {
      total: rows.length,
      resolved: rows.filter(r => r.status === 'Resolved').length,
      pending: rows.filter(r => r.status === 'Pending Approval').length,
      inProgress: rows.filter(r => ['Vendor Assigned', 'Under Repair'].includes(r.status)).length,
      rejected: rows.filter(r => r.status === 'Rejected').length,
      avgResolutionHours: (() => {
        const resolved = rows.filter(r => r.resolutionHours !== null);
        return resolved.length ? Math.round(resolved.reduce((a, r) => a + r.resolutionHours, 0) / resolved.length * 10) / 10 : null;
      })(),
      totalCost: rows.reduce((a, r) => a + (r.estimatedCost || 0), 0),
    };

    res.json({ summary, tickets: rows });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getSummaryReport, getAssetReport, getTicketReport, getLifecycleReport };
