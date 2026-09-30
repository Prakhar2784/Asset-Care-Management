const jwt      = require('jsonwebtoken');
const crypto   = require('crypto');
const mongoose = require('mongoose');
const User     = require('../models/User');
const { setTenantId } = require('./tenantContext');

// ─── API Key path ────────────────────────────────────────────────────────────
const protectWithApiKey = async (rawKey, req, res, next) => {
  try {
    // SHA-256 the incoming key for O(1) lookup (never stored in plaintext)
    const keyId = crypto.createHash('sha256').update(rawKey).digest('hex');

    const ApiKeyModel = mongoose.model('ApiKey');
    const apiKey = await ApiKeyModel.findOne({ keyId, isActive: true }, null, { bypassTenantFilter: true });

    if (!apiKey) {
      return res.status(401).json({ message: 'Invalid or inactive API key.' });
    }
    if (apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date()) {
      return res.status(401).json({ message: 'API key has expired.' });
    }

    // Set tenant context from the key's tenantId
    const { setTenantId } = require('./tenantContext');
    setTenantId(apiKey.tenantId, async () => {
      req.tenantId = apiKey.tenantId;
      req.apiKey   = apiKey; // scopes available at req.apiKey.scopes

      // Load the creating user so req.user is compatible with existing authorize() calls
      req.user = await User.findById(apiKey.createdBy).select('-password');
      if (!req.user) {
        return res.status(401).json({ message: 'API key owner not found.' });
      }

      // Stamp lastUsed fire-and-forget
      ApiKeyModel.findByIdAndUpdate(apiKey._id, { lastUsed: new Date() }).catch(() => {});

      next();
    });
  } catch (err) {
    console.error('API key auth error:', err);
    res.status(401).json({ message: 'API key validation failed.' });
  }
};

// ─── JWT path ────────────────────────────────────────────────────────────────
const protect = async (req, res, next) => {
  // Check for API key first
  const rawApiKey = req.headers['x-api-key'];
  if (rawApiKey) {
    return protectWithApiKey(rawApiKey, req, res, next);
  }

  // Fall back to Bearer JWT
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const isSuper = decoded.role?.toLowerCase() === 'super_admin' || decoded.role?.toLowerCase() === 'superadmin';
      const tenantId = isSuper ? 'default' : (decoded.tenantId || 'default');

      setTenantId(tenantId, async () => {
        req.tenantId = tenantId;
        let user = null;
        try {
          // 1. Check control plane (main DB)
          user = await mongoose.connection.model('User').findById(decoded.id).setOptions({ bypassTenantFilter: true }).select('-password');
        } catch {}

        // 2. Check tenant isolated DB if not found in control plane
        if (!user && tenantId && tenantId !== 'default') {
          try {
            const { getTenantConnection } = require('../config/tenantDb');
            const tenantConn = getTenantConnection(tenantId);
            user = await tenantConn.model('User').findById(decoded.id).setOptions({ bypassTenantFilter: true }).select('-password');
          } catch {}
        }

        req.user = user;
        if (!req.user) {
          return res.status(401).json({ message: 'Not authorized, user not found' });
        }

        // --- Tenant Activation & License Expiry Check ---
        const userRole = (req.user.role || '').toLowerCase();
        const isSuperUser = userRole === 'super_admin' || userRole === 'superadmin';
        if (!isSuperUser && tenantId !== 'default') {
          const TenantModel = mongoose.model('Tenant');
          const tenant = await TenantModel.findOne({ slug: tenantId }).setOptions({ bypassTenantFilter: true });
          if (tenant) {
            if (tenant.isActive === false) {
              return res.status(403).json({
                message: 'Company account is deactivated. Please contact the platform administrator.',
                code: 'COMPANY_DEACTIVATED'
              });
            }
            if (tenant.planExpiry) {
              const now = new Date();
              const planExp = new Date(tenant.planExpiry);
              if (now > planExp) {
                // Calculate 7-day grace period deadline
                const gracePeriodEnd = new Date(planExp.getTime() + 7 * 24 * 60 * 60 * 1000);
                const isWithinGracePeriod = now <= gracePeriodEnd;
                const path = req.originalUrl || req.path || '';
                const isBillingOrAuth = path.includes('/billing') || path.includes('/auth') || path.includes('/settings');
                const isAssetCleanup = (req.method === 'DELETE' || req.method === 'PATCH' || req.method === 'GET') && path.includes('/assets');
                const isReadOperation = req.method === 'GET';

                if (isWithinGracePeriod) {
                  // Inside 7-Day Grace Period:
                  // Allow GET reads, asset cleanup (DELETE/PATCH), and billing checkout.
                  // Block creation of NEW assets/tickets/users with a clear grace period notice.
                  if (req.method === 'POST' && (path.includes('/assets') || path.includes('/tickets') || path.includes('/users')) && !isBillingOrAuth) {
                    const daysLeft = Math.max(1, Math.ceil((gracePeriodEnd - now) / (1000 * 60 * 60 * 24)));
                    return res.status(403).json({
                      message: `Your subscription expired on ${planExp.toLocaleDateString('en-IN')}. Your account is in a 7-day grace period (${daysLeft} day${daysLeft === 1 ? '' : 's'} remaining). Please delete excess assets or renew your plan to create new records.`,
                      code: 'GRACE_PERIOD_ACTIVE',
                      gracePeriodDaysLeft: daysLeft
                    });
                  }
                  // Let request pass through (maintenance / billing / reads)
                } else {
                  // After 7-Day Grace Period: Fully lock account except billing / auth
                  if (!isBillingOrAuth && path !== '/api/auth/me') {
                    return res.status(403).json({
                      message: 'Your 7-day subscription grace period has expired. Please renew your subscription to reactivate your organization.',
                      code: 'LICENSE_EXPIRED'
                    });
                  }
                }
              }
            }
          }
        }
        next();
      });
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// Roles that have the same access level as 'admin'
const ADMIN_TIER_ROLES = ['admin', 'super_admin', 'hod', 'manager'];

// ─── Role authorization ───────────────────────────────────────────────────────
const authorize = (...roles) => {
  return (req, res, next) => {
    const userRole = (req.user?.role || '').toLowerCase();
    const normalizedRoles = roles.map(r => r.toLowerCase());
    const expanded = normalizedRoles.includes('admin')
      ? [...new Set([...normalizedRoles, ...ADMIN_TIER_ROLES.map(r => r.toLowerCase())])]
      : normalizedRoles;
    if (expanded.includes(userRole)) return next();
    return res.status(403).json({ message: `User role '${req.user?.role}' is not authorized to access this route` });
  };
};

// ─── Custom permission check (works for any role including employee) ───────────
// Usage: requirePermission('Register Assets')
// Usage: requirePermission('View All Assets', 'Register Assets')  â† OR logic
const requirePermission = (...features) => {
  return (req, res, next) => {
    const userRole = req.user.role;
    const customPerms = req.user.customPermissions || [];

    // Check if there is an explicit custom permission override first (for any role including admins/HODs)
    let allowedByOverride = null;
    for (const f of features) {
      const entry = customPerms.find(p => p.feature === f);
      if (entry !== undefined) {
        if (entry.allowed === true) {
          allowedByOverride = true;
          break;
        } else if (entry.allowed === false) {
          allowedByOverride = false;
        }
      }
    }

    if (allowedByOverride === true) return next();
    if (allowedByOverride === false) {
      return res.status(403).json({ message: `You do not have permission: ${features.join(' or ')}` });
    }

    // No explicit override found: fall back to role defaults
    // Admin-tier roles pass without custom permission check
    if (ADMIN_TIER_ROLES.includes(userRole)) return next();
    // Technicians are allowed to perform read-only asset lookups
    if (userRole === 'technician' && features.includes('View All Assets')) return next();

    return res.status(403).json({ message: `You do not have permission: ${features.join(' or ')}` });
  };
};

// ─── Tenant plan-feature gate ──────────────────────────────────────────────────
// Usage: router.get('/procurement', protect, requireFeature('procurement'), handler)
const requireFeature = (feature) => {
  return async (req, res, next) => {
    try {
      const Tenant = require('../models/Tenant');
      const tenant = await Tenant.findOne({ slug: req.tenantId });
      if (!tenant) return res.status(404).json({ message: 'Tenant not found' });

      if (!tenant.features?.[feature]) {
        return res.status(403).json({
          message: `This feature is not included in your current plan (${tenant.plan}). Please upgrade to access it.`,
        });
      }
      req.tenant = tenant;
      next();
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
};

// ─── Scope authorization (for API key callers) ────────────────────────────────
// Usage: router.get('/assets', protect, requireScope('read'), handler)
// JWT users pass through automatically (no scope restriction).
const requireScope = (...scopes) => {
  return (req, res, next) => {
    if (!req.apiKey) return next(); // JWT auth — no scope check needed

    const keyScopes = req.apiKey.scopes || [];
    const hasAdmin  = keyScopes.includes('admin');
    const hasAll    = scopes.every(s => keyScopes.includes(s));

    if (!hasAdmin && !hasAll) {
      return res.status(403).json({
        message: `API key is missing required scope(s): ${scopes.join(', ')}. Key has: ${keyScopes.join(', ')}`,
      });
    }
    next();
  };
};

module.exports = { protect, authorize, requirePermission, requireFeature, requireScope, ADMIN_TIER_ROLES };
