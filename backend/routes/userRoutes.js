const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, authorize } = require('../middleware/authMiddleware');

// GET /api/users/employees — all registered users for admin assignment dropdown
router.get('/employees', protect, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const users = await User.find({ isActive: true })
      .select('name email phone department role')
      .sort({ name: 1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
