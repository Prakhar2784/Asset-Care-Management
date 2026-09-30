// backend/routes/superAdminRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getPlatformStats,
  getExpiryMonitoring,
  getTenantDetails,
  manageTenantSubscription,
  createTenant,
  toggleTenantStatus,
  updateTenantPlan,
  deleteTenant,
  getTenantUsers,
  getCoupons,
  createCoupon,
  updateCoupon,
  toggleCouponStatus,
  deleteCoupon,
  getPlans,
  createPlan,
  updatePlan,
  togglePlanStatus,
  deletePlan,
  resetPlans,
  getGlobalSettings,
  updateGlobalSettings,
} = require('../controllers/superAdminController');
const { generateLicenseKey } = require('../services/licenseService');
const ContactLead = require('../models/ContactLead');

// Super Admin guard - must be logged in and have role 'super_admin'
const superAdminGuard = (req, res, next) => {
  const role = req.user?.role?.toLowerCase();
  if (!req.user || (role !== 'super_admin' && role !== 'superadmin')) {
    return res.status(403).json({ message: 'Access denied: Super Admin only.' });
  }
  next();
};

router.use(protect, superAdminGuard);

// ─── Platform & Expiry Analytics ───────────────────────────────────────────
router.get('/platform-stats', getPlatformStats);
router.get('/expiry-monitoring', getExpiryMonitoring);

// ─── Commercial License Key Generation ─────────────────────────────────
router.get('/generate-key/:slug', (req, res) => {
  try {
    const slug = (req.params.slug || '').toLowerCase().trim().replace(/[^a-z0-9-]/g, '');
    if (!slug) return res.status(400).json({ message: 'Valid company workspace slug is required.' });
    const licenseKey = generateLicenseKey(slug);
    res.json({ slug, licenseKey });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── Tenant / Company Management ───────────────────────────────────────────
router.post('/tenants', createTenant);
router.get('/tenants/:id/details', getTenantDetails);
router.post('/tenants/:id/subscription-action', manageTenantSubscription);
router.patch('/tenants/:id/toggle', toggleTenantStatus);
router.patch('/tenants/:id/plan', updateTenantPlan);
router.delete('/tenants/:id', deleteTenant);
router.get('/tenants/:id/users', getTenantUsers);

// ─── Plan & Pricing Management ─────────────────────────────────────────────
router.get('/plans', getPlans);
router.post('/plans', createPlan);
router.put('/plans/:planKey', updatePlan);
router.patch('/plans/:planKey/toggle', togglePlanStatus);
router.delete('/plans/:planKey', deletePlan);
router.post('/plans/reset', resetPlans);

// ─── Coupon Management ─────────────────────────────────────────────────────
router.get('/coupons', getCoupons);
router.post('/coupons', createCoupon);
router.put('/coupons/:id', updateCoupon);
router.patch('/coupons/:id/toggle', toggleCouponStatus);
router.delete('/coupons/:id', deleteCoupon);

// ─── Contact Leads ─────────────────────────────────────────────────────────
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

// ─── Universal Platform Settings ───────────────────────────────────────────
router.get('/global-settings', getGlobalSettings);
router.put('/global-settings', updateGlobalSettings);

module.exports = router;
