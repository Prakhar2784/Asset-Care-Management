const Asset = require('../models/Asset');
const Ticket = require('../models/Ticket');
const User = require('../models/User');

// GET /api/search?q=query
const globalSearch = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return res.json({ assets: [], tickets: [], users: [] });
    }

    const regex = new RegExp(q.trim(), 'i');
    const isAdmin = ['admin', 'super_admin'].includes(req.user.role);
    const isHod = req.user.role === 'hod' && !!req.user.department;

    // Pre-fetch dept scope for HOD so tickets can be filtered by dept
    let hodUserIds = [];
    let hodAssetIds = [];
    if (isHod) {
      const [deptUsers, deptAssets] = await Promise.all([
        User.find({ department: req.user.department }).select('_id'),
        Asset.find({ department: req.user.department, isDeleted: { $ne: true } }).select('_id'),
      ]);
      hodUserIds = deptUsers.map(u => u._id);
      hodAssetIds = deptAssets.map(a => a._id);
    }

    const [assets, tickets, users] = await Promise.all([
      isAdmin
        ? Asset.find({
            isDeleted: { $ne: true },
            $or: [{ name: regex }, { serialNumber: regex }, { category: regex }, { department: regex }]
          }).select('name serialNumber category department status').limit(6)
        : isHod
        ? Asset.find({
            isDeleted: { $ne: true },
            department: req.user.department,
            $or: [{ name: regex }, { serialNumber: regex }, { category: regex }],
          }).select('name serialNumber category department status').limit(6)
        : Asset.find({
            isDeleted: { $ne: true },
            $and: [
              { $or: [{ assignedTo: req.user._id }, { assignedEmployeeEmail: req.user.email }] },
              { $or: [{ name: regex }, { serialNumber: regex }] },
            ],
          }).select('name serialNumber category status').limit(4),

      Ticket.find({
        ...(isAdmin ? {} : isHod
          ? { $or: [{ raisedBy: { $in: hodUserIds } }, { asset: { $in: hodAssetIds } }] }
          : { raisedBy: req.user._id }),
        $or: [{ ticketId: regex }, { issue: regex }],
      })
        .select('ticketId issue status priority createdAt')
        .limit(6),

      isAdmin
        ? User.find({
            $or: [{ name: regex }, { email: regex }, { department: regex }],
            isActive: true
          }).select('name email role department').limit(4)
        : isHod
        ? User.find({
            department: req.user.department,
            $or: [{ name: regex }, { email: regex }],
            isActive: true,
          }).select('name email role department').limit(4)
        : [],
    ]);

    res.json({ assets, tickets, users });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { globalSearch };
