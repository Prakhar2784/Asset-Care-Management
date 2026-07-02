const express = require('express');
const router  = express.Router();
const crypto  = require('crypto');
const path    = require('path');
const User    = require('../models/User');
const bcrypt  = require('bcryptjs');
const { protect, authorize } = require('../middleware/authMiddleware');
const { sendWelcomeEmail, sendInviteEmail } = require('../services/emailService');
const AssetAssignment = require('../models/AssetAssignment');
const Asset           = require('../models/Asset');
const Ticket          = require('../models/Ticket');
const DeviceRequest   = require('../models/DeviceRequest');
const AuditLog        = require('../models/AuditLog');
const { avatarUpload } = require('../middleware/upload');
const { checkUserLimit } = require('../middleware/limitMiddleware');

// GET /api/users/employees — lightweight list for assignment dropdown
// Optional ?role=technician to filter by role
router.get('/employees', protect, authorize('admin', 'super_admin', 'hod'), async (req, res) => {
  try {
    const filter = { isActive: true };
    if (req.query.role) filter.role = req.query.role;
    const users = await User.find(filter)
      .select('name email phone department role')
      .sort({ name: 1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/users — all users (admin management)
router.get('/', protect, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const users = await User.find()
      .select('-password -passwordResetToken -passwordResetExpiry -otpHash -otpExpiry')
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/users — create user (admin)
router.post('/', protect, authorize('admin', 'super_admin'), checkUserLimit, async (req, res) => {
  try {
    const { name, email, password, role, department, phone } = req.body;
    if (!name || !email || !password || !department) {
      return res.status(400).json({ message: 'Name, email, password, and department are required.' });
    }
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'A user with this email already exists.' });

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    const user = await User.create({ name, email, password: hashed, role: role || 'employee', department, phone });
    sendWelcomeEmail(user, password).catch(() => {});

    res.status(201).json({ _id: user._id, name: user.name, email: user.email, role: user.role, department: user.department, phone: user.phone, isActive: user.isActive, createdAt: user.createdAt });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/users/:id — update role / department / active status
router.put('/:id', protect, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const { role, department, phone, isActive, employeeId } = req.body;
    const update = {};
    if (role       !== undefined) update.role       = role;
    if (department !== undefined) update.department = department;
    if (phone      !== undefined) update.phone      = phone;
    if (isActive   !== undefined) update.isActive   = isActive;
    if (employeeId !== undefined) update.employeeId = employeeId;

    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true })
      .select('-password -passwordResetToken -passwordResetExpiry -otpHash -otpExpiry');
    if (!user) return res.status(404).json({ message: 'User not found.' });

    // Sync department change to assignment records
    if (department !== undefined) {
      const Department = require('../models/Department');
      const dept = await Department.findOne({ name: { $regex: new RegExp(`^${department}$`, 'i') } });
      if (dept) {
        await AssetAssignment.updateMany(
          { employeeEmail: user.email, department: { $ne: dept._id } },
          { $set: { department: dept._id } }
        );
      }
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/users/:id/permissions — save custom per-user permissions
router.put('/:id/permissions', protect, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const { permissions } = req.body; // [{ feature, allowed }]
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { customPermissions: permissions },
      { new: true }
    ).select('-password -passwordResetToken -passwordResetExpiry -otpHash -otpExpiry');
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/users/:id — deactivate (soft delete)
router.delete('/:id', protect, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json({ message: 'User deactivated.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/users/:id/profile — full user profile with assets, tickets, device requests
router.get('/:id/profile', protect, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -passwordResetToken -passwordResetExpiry -otpHash -otpExpiry');
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const [assignments, tickets, deviceRequests] = await Promise.all([
      AssetAssignment.find({ user: user._id, status: 'Active' })
        .populate('asset', 'name serialNumber category status')
        .sort({ assignedAt: -1 }).limit(10),
      Ticket.find({ createdBy: user._id })
        .select('title status priority createdAt')
        .sort({ createdAt: -1 }).limit(10),
      DeviceRequest.find({ requestedBy: user._id })
        .select('deviceType status createdAt')
        .sort({ createdAt: -1 }).limit(10),
    ]);

    res.json({ user, assignments, tickets, deviceRequests });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/users/:id/activity — recent audit log entries for a user
router.get('/:id/activity', protect, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const logs = await AuditLog.find({ actor: req.params.id })
      .sort({ createdAt: -1 })
      .limit(30)
      .select('action entity entityLabel changes createdAt');
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/users/bulk — bulk create users from CSV import
router.post('/bulk', protect, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const { users: rows } = req.body;
    if (!Array.isArray(rows) || rows.length === 0)
      return res.status(400).json({ message: 'No users provided.' });

    const Tenant = require('../models/Tenant');
    const tenant = await Tenant.findOne({ slug: req.tenantId });
    const maxUsers = tenant?.limits?.maxUsers ?? Infinity;
    let userCount = await User.countDocuments();

    const results = { created: [], failed: [] };

    for (const row of rows) {
      const { name, email, role, department, phone } = row;
      if (!name || !email || !department) {
        results.failed.push({ email: email || '?', reason: 'Missing name, email or department.' });
        continue;
      }
      if (maxUsers !== -1 && userCount >= maxUsers) {
        results.failed.push({ email, reason: `Plan limit reached (${maxUsers} users). Upgrade your subscription to add more.` });
        continue;
      }
      try {
        const exists = await User.findOne({ email: email.toLowerCase().trim() });
        if (exists) { results.failed.push({ email, reason: 'Email already exists.' }); continue; }

        const inviteToken = crypto.randomBytes(32).toString('hex');
        const inviteExpiry = new Date(Date.now() + 48 * 60 * 60 * 1000);
        const placeholder = crypto.randomBytes(32).toString('hex');
        const salt = await bcrypt.genSalt(10);
        const hashed = await bcrypt.hash(placeholder, salt);

        const user = await User.create({
          name: name.trim(), email: email.toLowerCase().trim(),
          password: hashed, role: role?.trim() || 'employee',
          department: department.trim(), phone: phone?.trim() || '',
          passwordResetToken: inviteToken, passwordResetExpiry: inviteExpiry,
          isActive: false,
        });

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const inviteLink = `${frontendUrl}/reset-password/${inviteToken}?invite=true`;
        sendInviteEmail(user, inviteLink).catch(() => {});
        results.created.push({ name: user.name, email: user.email });
        userCount++;
      } catch (e) {
        results.failed.push({ email, reason: e.message });
      }
    }

    res.json({ message: `${results.created.length} created, ${results.failed.length} failed.`, ...results });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/users/invite — create user without password, send invite link
router.post('/invite', protect, authorize('admin', 'super_admin'), checkUserLimit, async (req, res) => {
  try {
    const { name, email, role, department, phone } = req.body;
    if (!name || !email || !department) {
      return res.status(400).json({ message: 'Name, email, and department are required.' });
    }
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'A user with this email already exists.' });

    // Create user with random placeholder password + invite token
    const placeholder = crypto.randomBytes(32).toString('hex');
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(placeholder, salt);
    const inviteToken = crypto.randomBytes(32).toString('hex');
    const inviteExpiry = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48h

    const user = await User.create({
      name, email, password: hashed, role: role || 'employee', department, phone,
      passwordResetToken: inviteToken,
      passwordResetExpiry: inviteExpiry,
      isActive: false, // activated on first login after setting password
    });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const inviteLink = `${frontendUrl}/reset-password/${inviteToken}?invite=true`;
    await sendInviteEmail(user, inviteLink);

    res.status(201).json({ message: `Invite sent to ${email}.`, userId: user._id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/users/:id/avatar — upload profile picture
router.post('/:id/avatar', protect, avatarUpload, async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(req.params.id, { avatar: avatarUrl }, { new: true })
      .select('-password -passwordResetToken -passwordResetExpiry -otpHash -otpExpiry');
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json({ avatar: user.avatar, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/users/:id/offboard — revoke all assets + close open tickets
router.post('/:id/offboard', protect, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    // Revoke all active asset assignments linked to this user
    const assignments = await AssetAssignment.find({ status: 'Assigned' }).then(
      all => all.filter(a => {
        // match by assignedTo on Asset or by email
        return a.employeeEmail?.toLowerCase() === user.email?.toLowerCase();
      })
    );
    for (const a of assignments) {
      a.status = 'Returned';
      await a.save();
      await Asset.findByIdAndUpdate(a.asset, {
        assignedStatus: 'Unassigned',
        assignedTo: null,
        assignedEmployeeName: null,
        assignedEmployeeEmail: null,
        assignedDate: null,
      });
    }

    // Close all open tickets
    const openStatuses = ['Pending Approval', 'Vendor Assigned', 'Under Repair'];
    await Ticket.updateMany(
      { raisedBy: req.params.id, status: { $in: openStatuses } },
      { status: 'Resolved' }
    );

    // Deactivate user
    user.isActive = false;
    await user.save();

    res.json({
      message: `${user.name} offboarded: ${assignments.length} asset(s) revoked, tickets closed.`,
      revokedAssets: assignments.length,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
