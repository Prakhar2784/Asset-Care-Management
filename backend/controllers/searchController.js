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
    const isAdmin = ['admin', 'super_admin', 'hod'].includes(req.user.role);

    const [assets, tickets, users] = await Promise.all([
      isAdmin
        ? Asset.find({
            isDeleted: { $ne: true },
            $or: [{ name: regex }, { serialNumber: regex }, { category: regex }, { department: regex }]
          }).select('name serialNumber category department status').limit(6)
        : Asset.find({
            isDeleted: { $ne: true },
            $and: [
              { $or: [{ assignedTo: req.user._id }, { assignedEmployeeEmail: req.user.email }] },
              { $or: [{ name: regex }, { serialNumber: regex }] },
            ],
          }).select('name serialNumber category status').limit(4),

      Ticket.find({
        ...(isAdmin ? {} : { raisedBy: req.user._id }),
        $or: [{ ticketId: regex }, { issue: regex }]
      })
        .select('ticketId issue status priority createdAt')
        .limit(6),

      isAdmin
        ? User.find({
            $or: [{ name: regex }, { email: regex }, { department: regex }],
            isActive: true
          }).select('name email role department').limit(4)
        : [],
    ]);

    res.json({ assets, tickets, users });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { globalSearch };
