const express = require('express');
const router  = express.Router();
const crypto  = require('crypto');
const path    = require('path');
const User    = require('../models/User');
const bcrypt  = require('bcryptjs');
const { protect, authorize } = require('../middleware/authMiddleware');
const { sendWelcomeEmail, sendInviteEmail, sendDeactivationEmail } = require('../services/emailService');
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
    const filter = { isActive: true, role: { $ne: 'super_admin' } };
    if (req.user.role === 'hod') {
      filter.role = 'employee';
    } else if (req.query.role) {
      filter.role = req.query.role;
    }
    const users = await User.find(filter)
      .select('name email phone department role')
      .sort({ name: 1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/users — all users (admin) or dept users (hod)
router.get('/', protect, authorize('admin', 'super_admin', 'hod'), async (req, res) => {
  try {
    const filter = {};
    if (req.user.role === 'hod' && req.user.department) {
      filter.department = req.user.department;
    }
    const users = await User.find(filter)
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

    // Pass the plaintext password — the User model's pre('save') hook hashes it.
    // Hashing here as well would double-hash and make login impossible.
    const user = await User.create({ name, email, password, role: role || 'employee', department, phone });
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

    // Capture current state before update to detect active→deactivated transition
    const existing = isActive === false
      ? await User.findById(req.params.id).select('isActive name email department')
      : null;

    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true })
      .select('-password -passwordResetToken -passwordResetExpiry -otpHash -otpExpiry');
    if (!user) return res.status(404).json({ message: 'User not found.' });

    // Send deactivation email only when flipping active → inactive
    if (existing?.isActive === true && isActive === false) {
      sendDeactivationEmail(existing).catch(() => {});
    }

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

// DELETE /api/users/:id — permanently delete user
router.delete('/:id', protect, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json({ message: 'User permanently deleted.' });
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
    const [tenant, userCount] = await Promise.all([
      Tenant.findOne({ slug: req.tenantId }),
      User.countDocuments(),
    ]);
    const maxUsers = tenant?.limits?.maxUsers ?? Infinity;

    const failed = [];

    // Validate rows in memory first
    const candidate = [];
    for (const row of rows) {
      const { name, email, role, department, phone } = row;
      if (!name || !email || !department) {
        failed.push({ email: email || '?', reason: 'Missing name, email or department.' });
        continue;
      }
      candidate.push({ name: name.trim(), email: email.toLowerCase().trim(), role: role?.trim() || 'employee', department: department.trim(), phone: phone?.trim() || '' });
    }

    // Single query to find all pre-existing emails
    const existingEmails = new Set(
      (await User.find({ email: { $in: candidate.map(r => r.email) } }).select('email')).map(u => u.email)
    );

    const unlimited = maxUsers === -1 || maxUsers == null || maxUsers === Infinity;
    let remaining = unlimited ? Infinity : maxUsers - userCount;

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const inviteExpiry = new Date(Date.now() + 48 * 60 * 60 * 1000);

    const docs = [];
    const pendingEmails = []; // { user doc fields, inviteLink } — sent after insertMany

    for (const row of candidate) {
      if (existingEmails.has(row.email)) {
        failed.push({ email: row.email, reason: 'Email already exists.' });
        continue;
      }
      if (remaining <= 0) {
        failed.push({ email: row.email, reason: `Plan limit reached (${maxUsers} users). Upgrade to add more.` });
        continue;
      }
      const inviteToken = crypto.randomBytes(32).toString('hex');
      const placeholder = crypto.randomBytes(32).toString('hex');
      docs.push({
        name: row.name, email: row.email,
        password: placeholder, role: row.role,
        department: row.department, phone: row.phone,
        passwordResetToken: crypto.createHash('sha256').update(inviteToken).digest('hex'),
        passwordResetExpiry: inviteExpiry,
        isActive: false,
      });
      pendingEmails.push({ name: row.name, email: row.email, inviteLink: `${frontendUrl}/reset-password/${inviteToken}?invite=true` });
      remaining--;
    }

    const inserted = docs.length > 0 ? await User.insertMany(docs, { ordered: false }) : [];

    // Fire invite emails asynchronously — don't block the response
    pendingEmails.forEach(({ name, email, inviteLink }) =>
      sendInviteEmail({ name, email }, inviteLink).catch(() => {})
    );

    const created = inserted.map(u => ({ name: u.name, email: u.email }));
    res.json({ message: `${created.length} created, ${failed.length} failed.`, created, failed });
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
    const inviteToken = crypto.randomBytes(32).toString('hex');
    const inviteExpiry = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48h

    const user = await User.create({
      name, email, password: placeholder, role: role || 'employee', department, phone,
      // Store the SHA-256 of the token — reset-password compares hashes
      passwordResetToken: crypto.createHash('sha256').update(inviteToken).digest('hex'),
      passwordResetExpiry: inviteExpiry,
      isActive: false, // activated when the invite link password is set
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
    const isSelf = req.user._id.toString() === req.params.id;
    const isPrivileged = ['admin', 'super_admin'].includes(req.user.role);
    if (!isSelf && !isPrivileged) {
      return res.status(403).json({ message: 'Not authorized to update this avatar.' });
    }
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
