const jwt = require('jsonwebtoken');
const { setTenantId } = require('./tenantContext');
const { getTenantConnection } = require('../config/tenantDb');
const Tenant = require('../models/Tenant');
const { verifyLicenseKey } = require('../services/licenseService');

// Memory cache to avoid hitting the database on every single API request
const verifiedLicenses = {};
const CACHE_TTL = 5 * 60 * 1000; // Cache validity for 5 minutes

const resolveTenantContext = async (req, res, next) => {
  // 1. Try to get tenant from headers
  let tenantId = req.headers['x-tenant-id'] || req.headers['X-Tenant-Id'];

  // 2. If not in headers, try to get it from JWT (if authorization header exists)
  if (!tenantId && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.decode(token); // decode without verification just to extract tenantId
      if (decoded && decoded.tenantId) {
        tenantId = decoded.tenantId;
      }
    } catch (err) {
      // Ignore decode errors, let authMiddleware handle verification
    }
  }

  // 3. Fallback to default
  if (!tenantId) {
    tenantId = 'default';
  }

  // 4. If this is a specific tenant context (not super-admin/default), verify their commercial license
  if (tenantId !== 'default') {
    const cached = verifiedLicenses[tenantId];
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
      if (!cached.isValid) {
        return res.status(402).json({ 
          message: "Invalid or expired commercial license. Please contact the system publisher to obtain a valid key." 
        });
      }
    } else {
      try {
        const tenant = await Tenant.findOne({ slug: tenantId.toLowerCase() });
        if (!tenant) {
          verifiedLicenses[tenantId] = { isValid: false, timestamp: Date.now() };
          return res.status(404).json({ message: "Tenant organisation not found." });
        }
        
        const isValid = verifyLicenseKey(tenant.licenseKey, tenant.slug);
        verifiedLicenses[tenantId] = { isValid, timestamp: Date.now() };
        
        if (!isValid) {
          return res.status(402).json({ 
            message: "Invalid or expired commercial license. Please contact the system publisher to obtain a valid key." 
          });
        }
      } catch (err) {
        console.error("License verification failed:", err.message);
        // Do not block request if database connection/query fails temporarily, but log it
      }
    }
  }

  // 5. Run the request lifetime in this tenant context
  setTenantId(tenantId, () => {
    try {
      req.tenantId = tenantId;
      // Fetch dynamic database connection pool
      req.db = getTenantConnection(tenantId);
      next();
    } catch (err) {
      res.status(500).json({ message: 'Database context resolution failed: ' + err.message });
    }
  });
};

module.exports = { resolveTenantContext };

