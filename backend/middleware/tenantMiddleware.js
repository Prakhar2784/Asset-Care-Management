const jwt = require('jsonwebtoken');
const { setTenantId } = require('./tenantContext');
const { getTenantConnection } = require('../config/tenantDb');

const resolveTenantContext = (req, res, next) => {
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

  // 4. Run the request lifetime in this tenant context
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
