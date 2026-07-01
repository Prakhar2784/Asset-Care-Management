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

// Super Admin guard - must be logged in and have role 'superadmin'
const superAdminGuard = (req, res, next) => {
  if (!req.user || req.user.role !== 'superadmin') {
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

module.exports = router;
