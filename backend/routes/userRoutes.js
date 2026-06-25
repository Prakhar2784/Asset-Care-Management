const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { protect, authorize } = require('../middleware/authMiddleware');
const { sendWelcomeEmail } = require('../services/emailService');

// GET /api/users/employees — lightweight list for assignment dropdown
router.get('/employees', protect, authorize('admin', 'super_admin', 'hod'), async (req, res) => {
  try {
    const users = await User.find({ isActive: true })
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
router.post('/', protect, authorize('admin', 'super_admin'), async (req, res) => {
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
    const { role, department, phone, isActive } = req.body;
    const update = {};
    if (role !== undefined) update.role = role;
    if (department !== undefined) update.department = department;
    if (phone !== undefined) update.phone = phone;
    if (isActive !== undefined) update.isActive = isActive;

    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true })
      .select('-password -passwordResetToken -passwordResetExpiry -otpHash -otpExpiry');
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

module.exports = router;
