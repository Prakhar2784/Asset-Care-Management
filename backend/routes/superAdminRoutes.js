// backend/routes/superAdminRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getPlatformStats,
  createTenant,
  toggleTenantStatus,
  updateTenantPlan,
  deleteTenant,
  getTenantUsers,
} = require('../controllers/superAdminController');
const ContactLead = require('../models/ContactLead');

// Super Admin guard - must be logged in and have role 'superadmin'
const superAdminGuard = (req, res, next) => {
  if (!req.user || req.user.role !== 'super_admin') {
    return res.status(403).json({ message: 'Access denied: Super Admin only.' });
  }
  next();
};

router.use(protect, superAdminGuard);

router.get('/platform-stats', getPlatformStats);
router.post('/tenants', createTenant);
router.patch('/tenants/:id/toggle', toggleTenantStatus);
router.patch('/tenants/:id/plan', updateTenantPlan);
router.delete('/tenants/:id', deleteTenant);
router.get('/tenants/:id/users', getTenantUsers);

// ─── Contact Leads ───────────────────────────────────────────────────────────
router.get('/leads', async (req, res) => {
  try {
    const leads = await ContactLead.find().sort({ createdAt: -1 });
    res.json(leads);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.patch('/leads/:id', async (req, res) => {
  try {
    const { status, notes } = req.body;
    const lead = await ContactLead.findByIdAndUpdate(
      req.params.id,
      { ...(status !== undefined && { status }), ...(notes !== undefined && { notes }) },
      { new: true }
    );
    if (!lead) return res.status(404).json({ message: 'Lead not found.' });
    res.json(lead);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.delete('/leads/:id', async (req, res) => {
  try {
    await ContactLead.findByIdAndDelete(req.params.id);
    res.json({ message: 'Lead deleted.' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;
