// backend/controllers/superAdminController.js
const Tenant = require('../models/Tenant');
const User = require('../models/User');
const { getTenantConnection } = require('../config/tenantDb');
const { getPlanDefaults } = require('../config/planDefaults');

// Helper: get a model from a tenant's isolated connection
const getTenantModel = (tenantSlug, modelName) => {
  const conn = getTenantConnection(tenantSlug);
  return conn.model(modelName);
};

// ─── GET /api/super-admin/platform-stats ──────────────────────────────────────
const getPlatformStats = async (req, res) => {
  try {
    const tenants = await Tenant.find({});
    const totalTenants = tenants.length;
    const activeTenants = tenants.filter(t => t.isActive).length;
    const suspendedTenants = tenants.filter(t => !t.isActive).length;

    const planBreakdown = {
      Basic: tenants.filter(t => t.plan === 'Basic').length,
      Pro: tenants.filter(t => t.plan === 'Pro').length,
      Enterprise: tenants.filter(t => t.plan === 'Enterprise').length,
    };

    // Collect per-tenant usage data
    const tenantStats = await Promise.all(
      tenants.map(async (tenant) => {
        try {
          const slug = tenant.slug;
          const AssetModel = getTenantModel(slug, 'Asset');
          const UserModel = getTenantModel(slug, 'User');
          const TicketModel = getTenantModel(slug, 'Ticket');

          const [assetCount, userCount, ticketCount] = await Promise.all([
            AssetModel.countDocuments({ isDeleted: { $ne: true } }).catch(() => 0),
            UserModel.countDocuments({}).catch(() => 0),
            TicketModel.countDocuments({}).catch(() => 0),
          ]);

          return {
            _id: tenant._id,
            name: tenant.name,
            slug: tenant.slug,
            plan: tenant.plan,
            isActive: tenant.isActive,
            branding: tenant.branding,
            limits: tenant.limits,
            createdAt: tenant.createdAt,
            usage: {
              assets: assetCount,
              users: userCount,
              tickets: ticketCount,
              assetUtilization: tenant.limits.maxAssets > 0
                ? Math.min(100, Math.round((assetCount / tenant.limits.maxAssets) * 100))
                : 0,
              userUtilization: tenant.limits.maxUsers > 0
                ? Math.min(100, Math.round((userCount / tenant.limits.maxUsers) * 100))
                : 0,
            },
          };
        } catch {
          return {
            _id: tenant._id,
            name: tenant.name,
            slug: tenant.slug,
            plan: tenant.plan,
            isActive: tenant.isActive,
            branding: tenant.branding,
            limits: tenant.limits,
            createdAt: tenant.createdAt,
            usage: { assets: 0, users: 0, tickets: 0, assetUtilization: 0, userUtilization: 0 },
          };
        }
      })
    );

    const totalAssets = tenantStats.reduce((a, t) => a + t.usage.assets, 0);
    const totalTickets = tenantStats.reduce((a, t) => a + t.usage.tickets, 0);
    const totalUsers = tenantStats.reduce((a, t) => a + t.usage.users, 0);

    res.json({
      platform: {
        totalTenants,
        activeTenants,
        suspendedTenants,
        totalUsers,
        totalAssets,
        totalTickets,
        planBreakdown,
      },
      tenants: tenantStats,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── POST /api/super-admin/tenants ─────────────────────────────────────────
const createTenant = async (req, res) => {
  try {
    const { name, slug, plan, maxAssets, maxUsers, adminEmail, adminName, adminPassword } = req.body;

    if (!name || !slug || !adminEmail || !adminName || !adminPassword) {
      return res.status(400).json({ message: 'name, slug, adminEmail, adminName, and adminPassword are required.' });
    }

    const exists = await Tenant.findOne({ slug: slug.toLowerCase().trim() });
    if (exists) {
      return res.status(400).json({ message: `A company with slug "${slug}" already exists.` });
    }

    const selectedPlan = plan || 'Basic';
    const planDefaults = getPlanDefaults(selectedPlan);

    const tenant = await Tenant.create({
      name,
      slug: slug.toLowerCase().trim(),
      plan: selectedPlan,
      limits: {
        maxAssets: maxAssets ?? planDefaults.maxAssets,
        maxUsers: maxUsers ?? planDefaults.maxUsers,
      },
      features: planDefaults.features,
    });

    // Provision the tenant DB and create admin user
    const tenantConn = getTenantConnection(tenant.slug);
    const TenantUser = tenantConn.model('User');

    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    await TenantUser.create({
      name: adminName,
      email: adminEmail,
      password: hashedPassword,
      role: 'admin',
      tenantId: tenant.slug,
      department: 'Administration',
      isActive: true,
    });

    res.status(201).json({
      message: `Company "${name}" provisioned successfully with admin account.`,
      tenant,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── PATCH /api/super-admin/tenants/:id/toggle ─────────────────────────────
const toggleTenantStatus = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) return res.status(404).json({ message: 'Tenant not found.' });

    tenant.isActive = !tenant.isActive;
    await tenant.save();

    res.json({
      message: `Company "${tenant.name}" has been ${tenant.isActive ? 'activated' : 'suspended'}.`,
      isActive: tenant.isActive,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── PATCH /api/super-admin/tenants/:id/plan ───────────────────────────────
const updateTenantPlan = async (req, res) => {
  try {
    const { plan, maxAssets, maxUsers, features } = req.body;
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) return res.status(404).json({ message: 'Tenant not found.' });

    if (plan && plan !== tenant.plan) {
      // Switching tiers resets limits/features to that tier's defaults,
      // unless this same request also passes explicit overrides below.
      const planDefaults = getPlanDefaults(plan);
      tenant.plan = plan;
      tenant.limits.maxAssets = planDefaults.maxAssets;
      tenant.limits.maxUsers = planDefaults.maxUsers;
      tenant.features = planDefaults.features;
    }
    if (maxAssets !== undefined) tenant.limits.maxAssets = maxAssets;
    if (maxUsers !== undefined) tenant.limits.maxUsers = maxUsers;
    if (features) tenant.features = { ...tenant.features, ...features };

    await tenant.save();
    res.json({ message: `Plan updated for "${tenant.name}".`, tenant });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── DELETE /api/super-admin/tenants/:id ───────────────────────────────────
const deleteTenant = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) return res.status(404).json({ message: 'Tenant not found.' });
    if (tenant.slug === 'default') {
      return res.status(400).json({ message: 'The default tenant cannot be deleted.' });
    }

    await Tenant.findByIdAndDelete(req.params.id);
    res.json({ message: `Company "${tenant.name}" deleted from the platform.` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── GET /api/super-admin/tenants/:id/users ───────────────────────────────
const getTenantUsers = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) return res.status(404).json({ message: 'Tenant not found.' });

    const TenantUser = getTenantModel(tenant.slug, 'User');
    const users = await TenantUser.find({}).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getPlatformStats,
  createTenant,
  toggleTenantStatus,
  updateTenantPlan,
  deleteTenant,
  getTenantUsers,
};
