// backend/controllers/analyticsController.js
// Advanced Business Intelligence & Analytics API
const Asset = require('../models/Asset');
const Ticket = require('../models/Ticket');
const PurchaseOrder = require('../models/PurchaseOrder');
const PurchaseRequest = require('../models/PurchaseRequest');
const GoodsReceivedNote = require('../models/GoodsReceivedNote');
const User = require('../models/User');
const MaintenanceSchedule = require('../models/MaintenanceSchedule');

// Build department-scoped filters for HOD users.
// Returns { assetMatch, ticketAssetIds, userIds, dept } — inject these into queries.
const buildHodScope = async (req) => {
  if (req.user.role !== 'hod' || !req.user.department) return null;
  const dept = req.user.department;
  const [deptAssets, deptUsers] = await Promise.all([
    Asset.find({ department: dept, isDeleted: { $ne: true } }).select('_id').lean(),
    User.find({ department: dept }).select('_id').lean(),
  ]);
  const assetIds = deptAssets.map(a => a._id);
  const userIds = deptUsers.map(u => u._id);
  return { dept, assetIds, userIds, assetMatch: { department: dept } };
};

// ─── GET /api/analytics/overview ─────────────────────────────────────────────
// Full overview KPIs for the analytics dashboard
const getOverview = async (req, res) => {
  try {
    const hod = await buildHodScope(req);
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const last12Months = new Date(now);
    last12Months.setMonth(last12Months.getMonth() - 11);
    last12Months.setDate(1);
    last12Months.setHours(0, 0, 0, 0);

    const assetBase = hod ? { isDeleted: { $ne: true }, department: hod.dept } : { isDeleted: { $ne: true } };
    const ticketBase = hod ? { $or: [{ raisedBy: { $in: hod.userIds } }, { asset: { $in: hod.assetIds } }] } : {};
    const userBase = hod ? { department: hod.dept } : {};

    const [
      totalAssets,
      activeAssets,
      totalTickets,
      resolvedTickets,
      openTickets,
      totalUsers,
      warrantyExpiring30,
      warrantyExpired,
      allAssets,
      pendingMaintenance,
    ] = await Promise.all([
      Asset.countDocuments(assetBase),
      Asset.countDocuments({ ...assetBase, status: 'Active' }),
      Ticket.countDocuments(ticketBase),
      Ticket.countDocuments({ ...ticketBase, status: 'Resolved' }),
      Ticket.countDocuments({ ...ticketBase, status: { $in: ['Pending Approval', 'Vendor Assigned', 'Waiting Vendor', 'Waiting Parts', 'Under Repair'] } }),
      User.countDocuments(userBase),
      Asset.countDocuments({ ...assetBase, warrantyEnd: { $gte: now, $lte: new Date(now.getTime() + 30 * 86400000) } }),
      Asset.countDocuments({ ...assetBase, warrantyEnd: { $lt: now } }),
      Asset.find({ ...assetBase, purchaseCost: { $gt: 0 } }).select('purchaseCost procurementDate category department').lean(),
      hod
        ? MaintenanceSchedule.countDocuments({ asset: { $in: hod.assetIds }, status: 'Scheduled', nextDue: { $lte: new Date(now.getTime() + 7 * 86400000) } })
        : MaintenanceSchedule.countDocuments({ status: 'Scheduled', nextDue: { $lte: new Date(now.getTime() + 7 * 86400000) } }),
    ]);

    // Total asset portfolio value
    const totalPortfolioValue = allAssets.reduce((sum, a) => sum + (a.purchaseCost || 0), 0);

    // Assets by age bracket
    const ageBrackets = { '<1yr': 0, '1-3yr': 0, '3-5yr': 0, '>5yr': 0 };
    allAssets.forEach(a => {
      if (!a.procurementDate) return;
      const ageYears = (now - new Date(a.procurementDate)) / (365.25 * 86400000);
      if (ageYears < 1) ageBrackets['<1yr']++;
      else if (ageYears < 3) ageBrackets['1-3yr']++;
      else if (ageYears < 5) ageBrackets['3-5yr']++;
      else ageBrackets['>5yr']++;
    });

    const ticketResolutionRate = totalTickets > 0 ? Math.round((resolvedTickets / totalTickets) * 100) : 0;

    res.json({
      kpis: {
        totalAssets,
        activeAssets,
        totalTickets,
        resolvedTickets,
        openTickets,
        totalUsers,
        warrantyExpiring30,
        warrantyExpired,
        totalPortfolioValue,
        ticketResolutionRate,
        pendingMaintenance,
      },
      assetAgeBrackets: Object.entries(ageBrackets).map(([name, count]) => ({ name, count })),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── GET /api/analytics/asset-cost ───────────────────────────────────────────
// Asset cost breakdown by category & department
const getAssetCostAnalysis = async (req, res) => {
  try {
    const hod = await buildHodScope(req);
    const assetBase = hod ? { isDeleted: { $ne: true }, department: hod.dept } : { isDeleted: { $ne: true } };
    const [byCategory, byDepartment, byStatus] = await Promise.all([
      Asset.aggregate([
        { $match: { ...assetBase, purchaseCost: { $gt: 0 } } },
        { $group: { _id: '$category', totalCost: { $sum: '$purchaseCost' }, count: { $sum: 1 }, avgCost: { $avg: '$purchaseCost' } } },
        { $sort: { totalCost: -1 } },
      ]),
      Asset.aggregate([
        { $match: { ...assetBase, purchaseCost: { $gt: 0 } } },
        { $group: { _id: '$department', totalCost: { $sum: '$purchaseCost' }, count: { $sum: 1 } } },
        { $sort: { totalCost: -1 } },
        { $limit: 10 },
      ]),
      Asset.aggregate([
        { $match: assetBase },
        { $group: { _id: '$status', count: { $sum: 1 }, totalCost: { $sum: '$purchaseCost' } } },
      ]),
    ]);

    res.json({
      byCategory: byCategory.map(d => ({ name: d._id || 'Unknown', totalCost: d.totalCost, count: d.count, avgCost: Math.round(d.avgCost) })),
      byDepartment: byDepartment.map(d => ({ name: d._id || 'Unassigned', totalCost: d.totalCost, count: d.count })),
      byStatus: byStatus.map(d => ({ name: d._id || 'Unknown', count: d.count, totalCost: d.totalCost || 0 })),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── GET /api/analytics/procurement-trends ───────────────────────────────────
// Monthly procurement spend over the last 12 months
const getProcurementTrends = async (req, res) => {
  try {
    const last12Months = new Date();
    last12Months.setMonth(last12Months.getMonth() - 11);
    last12Months.setDate(1);
    last12Months.setHours(0, 0, 0, 0);

    const [monthlySpend, byVendor, statusBreakdown, topItems] = await Promise.all([
      PurchaseOrder.aggregate([
        { $match: { createdAt: { $gte: last12Months }, status: { $ne: 'Cancelled' } } },
        {
          $group: {
            _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
            totalSpend: { $sum: '$totalAmount' },
            count: { $sum: 1 },
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
      PurchaseOrder.aggregate([
        { $match: { status: { $nin: ['Cancelled', 'Draft'] } } },
        { $lookup: { from: 'vendors', localField: 'vendor', foreignField: '_id', as: 'vendorInfo' } },
        { $unwind: { path: '$vendorInfo', preserveNullAndEmptyArrays: true } },
        { $group: { _id: '$vendorInfo.name', totalSpend: { $sum: '$totalAmount' }, orderCount: { $sum: 1 } } },
        { $sort: { totalSpend: -1 } },
        { $limit: 8 },
      ]),
      PurchaseRequest.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      PurchaseOrder.aggregate([
        { $match: { status: { $nin: ['Cancelled', 'Draft'] } } },
        { $unwind: '$items' },
        { $group: { _id: '$items.name', totalCost: { $sum: '$items.totalCost' }, totalQty: { $sum: '$items.quantity' } } },
        { $sort: { totalCost: -1 } },
        { $limit: 10 },
      ]),
    ]);

    // Fill in missing months with 0
    const filledMonths = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      const found = monthlySpend.find(m => m._id.year === year && m._id.month === month);
      filledMonths.push({
        label: d.toLocaleString('en-IN', { month: 'short', year: '2-digit' }),
        totalSpend: found?.totalSpend || 0,
        count: found?.count || 0,
      });
    }

    res.json({
      monthlySpend: filledMonths,
      byVendor: byVendor.map(d => ({ name: d._id || 'Unknown Vendor', totalSpend: d.totalSpend, orderCount: d.orderCount })),
      statusBreakdown: statusBreakdown.map(d => ({ name: d._id || 'Unknown', count: d.count })),
      topItems: topItems.map(d => ({ name: d._id || 'Unknown', totalCost: d.totalCost, totalQty: d.totalQty })),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── GET /api/analytics/ticket-trends ────────────────────────────────────────
// Ticket resolution times, SLA analysis, volume trends
const getTicketTrends = async (req, res) => {
  try {
    const hod = await buildHodScope(req);
    const ticketBase = hod ? { $or: [{ raisedBy: { $in: hod.userIds } }, { asset: { $in: hod.assetIds } }] } : {};
    const last12Months = new Date();
    last12Months.setMonth(last12Months.getMonth() - 11);
    last12Months.setDate(1);
    last12Months.setHours(0, 0, 0, 0);

    const [monthlyVolume, byPriority, avgResolutionByPriority, byCategory] = await Promise.all([
      Ticket.aggregate([
        { $match: { ...ticketBase, createdAt: { $gte: last12Months } } },
        {
          $group: {
            _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' }, status: '$status' },
            count: { $sum: 1 },
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
      Ticket.aggregate([
        { $match: ticketBase },
        { $group: { _id: '$priority', count: { $sum: 1 }, resolved: { $sum: { $cond: [{ $eq: ['$status', 'Resolved'] }, 1, 0] } } } },
      ]),
      Ticket.aggregate([
        { $match: { ...ticketBase, status: 'Resolved' } },
        {
          $project: {
            priority: 1,
            resolutionHours: {
              $divide: [{ $subtract: ['$updatedAt', '$createdAt'] }, 3600000]
            }
          }
        },
        { $group: { _id: '$priority', avgHours: { $avg: '$resolutionHours' } } },
      ]),
      Ticket.aggregate([
        { $match: ticketBase },
        { $lookup: { from: 'assets', localField: 'asset', foreignField: '_id', as: 'assetInfo' } },
        { $unwind: { path: '$assetInfo', preserveNullAndEmptyArrays: true } },
        { $group: { _id: '$assetInfo.category', count: { $sum: 1 }, totalCost: { $sum: '$estimatedCost' } } },
        { $sort: { count: -1 } },
        { $limit: 8 },
      ]),
    ]);

    // Build monthly summary (open vs resolved)
    const monthMap = {};
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const label = d.toLocaleString('en-IN', { month: 'short', year: '2-digit' });
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      monthMap[key] = { label, raised: 0, resolved: 0 };
    }
    monthlyVolume.forEach(m => {
      const key = `${m._id.year}-${m._id.month}`;
      if (monthMap[key]) {
        monthMap[key].raised += m.count;
        if (m._id.status === 'Resolved') monthMap[key].resolved += m.count;
      }
    });

    res.json({
      monthlyVolume: Object.values(monthMap),
      byPriority: byPriority.map(d => ({
        name: d._id || 'Unknown',
        count: d.count,
        resolved: d.resolved,
        rate: d.count > 0 ? Math.round((d.resolved / d.count) * 100) : 0,
      })),
      avgResolutionByPriority: avgResolutionByPriority.map(d => ({
        name: d._id || 'Unknown',
        avgHours: Math.round(d.avgHours * 10) / 10,
      })),
      byCategory: byCategory.map(d => ({ name: d._id || 'General', count: d.count, totalCost: d.totalCost || 0 })),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── GET /api/analytics/depreciation ─────────────────────────────────────────
// Asset depreciation summary using Straight-Line Method (SLM)
const getDepreciationSummary = async (req, res) => {
  try {
    const hod = await buildHodScope(req);
    const { method = 'slm', usefulLifeYears = 5 } = req.query;
    const now = new Date();
    const lifeYears = parseInt(usefulLifeYears);
    const salvageRate = 0.10; // 10% residual value

    const depFilter = {
      isDeleted: { $ne: true },
      purchaseCost: { $gt: 0 },
      procurementDate: { $exists: true, $ne: null },
      ...(hod ? { department: hod.dept } : {}),
    };

    const assets = await Asset.find(depFilter).select('name category department purchaseCost procurementDate status serialNumber').lean();

    const depreciatedAssets = assets.map(asset => {
      const cost = asset.purchaseCost;
      const salvage = cost * salvageRate;
      const ageMs = now - new Date(asset.procurementDate);
      const ageYears = Math.max(0, ageMs / (365.25 * 86400000));
      const ageYearsCapped = Math.min(ageYears, lifeYears);

      let bookValue, annualDepreciation, accumulated;

      if (method === 'wdv') {
        // Written Down Value (Declining Balance) at 20% rate
        const rate = 0.20;
        bookValue = cost * Math.pow(1 - rate, ageYearsCapped);
        accumulated = cost - bookValue;
        annualDepreciation = bookValue * rate;
      } else {
        // Straight Line Method
        annualDepreciation = (cost - salvage) / lifeYears;
        accumulated = annualDepreciation * ageYearsCapped;
        bookValue = Math.max(salvage, cost - accumulated);
      }

      const depreciationPct = cost > 0 ? Math.round(((cost - bookValue) / cost) * 100) : 0;
      const fullyDepreciated = ageYears >= lifeYears;

      return {
        _id: asset._id,
        name: asset.name,
        category: asset.category,
        department: asset.department,
        serialNumber: asset.serialNumber,
        status: asset.status,
        purchaseCost: cost,
        procurementDate: asset.procurementDate,
        ageYears: Math.round(ageYears * 10) / 10,
        bookValue: Math.round(Math.max(0, bookValue)),
        accumulated: Math.round(accumulated),
        annualDepreciation: Math.round(annualDepreciation),
        depreciationPct,
        fullyDepreciated,
      };
    });

    // Aggregated summary
    const totalOriginalCost = depreciatedAssets.reduce((s, a) => s + a.purchaseCost, 0);
    const totalBookValue = depreciatedAssets.reduce((s, a) => s + a.bookValue, 0);
    const totalAccumulated = depreciatedAssets.reduce((s, a) => s + a.accumulated, 0);
    const fullyDepreciatedCount = depreciatedAssets.filter(a => a.fullyDepreciated).length;

    // By category summary
    const categoryMap = {};
    depreciatedAssets.forEach(a => {
      if (!categoryMap[a.category]) categoryMap[a.category] = { name: a.category, originalCost: 0, bookValue: 0, count: 0 };
      categoryMap[a.category].originalCost += a.purchaseCost;
      categoryMap[a.category].bookValue += a.bookValue;
      categoryMap[a.category].count++;
    });

    res.json({
      summary: {
        totalAssets: depreciatedAssets.length,
        totalOriginalCost,
        totalBookValue,
        totalAccumulated,
        fullyDepreciatedCount,
        overallDepreciationPct: totalOriginalCost > 0 ? Math.round((totalAccumulated / totalOriginalCost) * 100) : 0,
        method,
        usefulLifeYears: lifeYears,
      },
      byCategory: Object.values(categoryMap).sort((a, b) => b.originalCost - a.originalCost),
      assets: depreciatedAssets.sort((a, b) => b.accumulated - a.accumulated),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── GET /api/analytics/department-scorecard ─────────────────────────────────
// Per-department asset health, ticket load, and cost scorecard
const getDepartmentScorecard = async (req, res) => {
  try {
    const hod = await buildHodScope(req);
    const assetMatchBase = hod ? { isDeleted: { $ne: true }, department: hod.dept } : { isDeleted: { $ne: true } };
    const [assetsByDept, ticketsByDept] = await Promise.all([
      Asset.aggregate([
        { $match: assetMatchBase },
        {
          $group: {
            _id: '$department',
            totalAssets: { $sum: 1 },
            totalCost: { $sum: '$purchaseCost' },
            active: { $sum: { $cond: [{ $eq: ['$status', 'Active'] }, 1, 0] } },
            underRepair: { $sum: { $cond: [{ $eq: ['$status', 'Under Repair'] }, 1, 0] } },
            decommissioned: { $sum: { $cond: [{ $eq: ['$status', 'Decommissioned'] }, 1, 0] } },
          }
        },
        { $sort: { totalAssets: -1 } },
      ]),
      Ticket.aggregate([
        ...(hod ? [{ $match: { $or: [{ raisedBy: { $in: hod.userIds } }, { asset: { $in: hod.assetIds } }] } }] : []),
        {
          $lookup: {
            from: 'assets',
            localField: 'asset',
            foreignField: '_id',
            as: 'assetInfo'
          }
        },
        { $unwind: { path: '$assetInfo', preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: '$assetInfo.department',
            totalTickets: { $sum: 1 },
            resolvedTickets: { $sum: { $cond: [{ $eq: ['$status', 'Resolved'] }, 1, 0] } },
            totalRepairCost: { $sum: '$estimatedCost' },
          }
        },
      ]),
    ]);

    // Merge datasets
    const deptMap = {};
    assetsByDept.forEach(d => {
      deptMap[d._id || 'Unassigned'] = {
        department: d._id || 'Unassigned',
        totalAssets: d.totalAssets,
        totalCost: d.totalCost || 0,
        active: d.active,
        underRepair: d.underRepair,
        decommissioned: d.decommissioned,
        healthRate: d.totalAssets > 0 ? Math.round((d.active / d.totalAssets) * 100) : 0,
        totalTickets: 0,
        resolvedTickets: 0,
        totalRepairCost: 0,
        resolutionRate: 0,
      };
    });
    ticketsByDept.forEach(d => {
      const key = d._id || 'Unassigned';
      if (deptMap[key]) {
        deptMap[key].totalTickets = d.totalTickets;
        deptMap[key].resolvedTickets = d.resolvedTickets;
        deptMap[key].totalRepairCost = d.totalRepairCost || 0;
        deptMap[key].resolutionRate = d.totalTickets > 0 ? Math.round((d.resolvedTickets / d.totalTickets) * 100) : 0;
      }
    });

    res.json({ departments: Object.values(deptMap) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getOverview,
  getAssetCostAnalysis,
  getProcurementTrends,
  getTicketTrends,
  getDepreciationSummary,
  getDepartmentScorecard,
};
