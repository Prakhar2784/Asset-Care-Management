const Tenant = require('../models/Tenant');

const checkLicenseExpiry = async (req, res, next) => {
  try {
    // Skip checking for super admins
    if (req.user && req.user.role === 'super_admin') {
      return next();
    }
    
    // We need tenant ID to check license
    if (!req.tenantId || req.tenantId === 'default') {
      return next();
    }

    const tenant = await Tenant.findOne({ slug: req.tenantId });
    if (!tenant) {
      return next();
    }

    // Check expiry
    if (tenant.planExpiry) {
      const now = new Date();
      if (now > new Date(tenant.planExpiry)) {
        // License is expired
        return res.status(403).json({
          message: 'Your license has expired. Please renew your subscription to continue using IAssetCare.',
          code: 'LICENSE_EXPIRED'
        });
      }
    }
    
    next();
  } catch (error) {
    console.error('License middleware error:', error);
    next();
  }
};

module.exports = {
  checkLicenseExpiry
};
