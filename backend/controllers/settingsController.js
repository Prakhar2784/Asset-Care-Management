const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Ticket = require('../models/Ticket');
const Asset = require('../models/Asset');
const Notification = require('../models/Notification');
const DeviceRequest = require('../models/DeviceRequest');

// PUT /api/settings/profile
const updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;
    const updates = {};
    if (name && name.trim()) updates.name = name.trim();
    if (phone !== undefined) updates.phone = phone.trim();

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true })
      .select('-password -passwordResetToken -passwordResetExpiry -otpHash -otpExpiry');

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/settings/change-password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Both current and new password are required.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters.' });
    }

    const user = await User.findById(req.user._id);
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect.' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save({ validateBeforeSave: false });

    res.json({ message: 'Password changed successfully.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/settings/export-data
const exportMyData = async (req, res) => {
  try {
    const userId = req.user._id;

    const [user, tickets, notifications, deviceRequests, assignedAssets] = await Promise.all([
      User.findById(userId).select('-password -passwordResetToken -passwordResetExpiry -otpHash -otpExpiry'),
      Ticket.find({ raisedBy: userId })
        .populate('asset', 'name serialNumber')
        .sort({ createdAt: -1 }),
      Notification.find({ user: userId }).sort({ createdAt: -1 }).limit(100),
      DeviceRequest.find({ raisedBy: userId }).sort({ createdAt: -1 }),
      Asset.find({ assignedTo: userId, isDeleted: { $ne: true } }).select('name serialNumber category status department'),
    ]);

    res.json({
      exportedAt: new Date().toISOString(),
      profile: user,
      assignedAssets,
      tickets: tickets.map(t => ({
        ticketId: t.ticketId,
        issue: t.issue,
        priority: t.priority,
        status: t.status,
        asset: t.asset?.name || t.itemLabel || 'N/A',
        raisedAt: t.createdAt,
        lastUpdated: t.updatedAt,
        estimatedCost: t.estimatedCost,
      })),
      deviceRequests: deviceRequests.map(r => ({
        requestId: r.requestId,
        requestType: r.requestType,
        itemRequested: r.itemRequested,
        status: r.status,
        urgency: r.urgency,
        raisedAt: r.createdAt,
      })),
      notifications: notifications.map(n => ({
        title: n.title,
        message: n.message,
        type: n.type,
        isRead: n.isRead,
        receivedAt: n.createdAt,
      })),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/settings/system-stats  (admin only)
const getSystemStats = async (req, res) => {
  try {
    const [totalUsers, activeUsers, totalAssets, deletedAssets] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      Asset.countDocuments({ isDeleted: { $ne: true } }),
      Asset.countDocuments({ isDeleted: true }),
    ]);
    res.json({ totalUsers, activeUsers, totalAssets, deletedAssets });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { updateProfile, changePassword, exportMyData, getSystemStats };
