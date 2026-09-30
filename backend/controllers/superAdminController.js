// backend/controllers/superAdminController.js
const mongoose = require('mongoose');
const Tenant = require('../models/Tenant');
const User = require('../models/User');
const Invoice = require('../models/Invoice');
const SubscriptionHistory = require('../models/SubscriptionHistory');
const Coupon = require('../models/Coupon');
const { getTenantConnection } = require('../config/tenantDb');
const { getPlanDefaults } = require('../config/planDefaults');
const billingConfig = require('../config/billingConfig');
const { generateLicenseKey } = require('../services/licenseService');

// Helper: get a model from a tenant's isolated connection
const getTenantModel = (tenantSlug, modelName) => {
  const conn = getTenantConnection(tenantSlug);
  return conn.model(modelName);
};

// ─── GET /api/super-admin/platform-stats ──────────────────────────────────────
const getPlatformStats = async (req, res) => {
  try {
    const tenants = await Tenant.find({}).setOptions({ bypassTenantFilter: true });
    const nonDefaultTenants = tenants.filter(t => t.slug !== 'default');
    const now = new Date();

    const totalTenants = nonDefaultTenants.length;
    const activeSubscriptions = nonDefaultTenants.filter(t => t.subscriptionStatus === 'Active' && (!t.planExpiry || new Date(t.planExpiry) > now)).length;
    const cancelledSubscriptions = nonDefaultTenants.filter(t => t.subscriptionStatus === 'Cancelled').length;
    const pendingCheckout = nonDefaultTenants.filter(t => t.subscriptionStatus === 'Pending Checkout' || !t.plan).length;
    const expiredSubscriptions = nonDefaultTenants.filter(t => t.subscriptionStatus === 'Expired' || (t.planExpiry && new Date(t.planExpiry) <= now && t.subscriptionStatus !== 'Pending Checkout')).length;

    // Subscriptions expiring in <= 30 and <= 15 days
    const expiringIn30 = nonDefaultTenants.filter(t => {
      if (!t.planExpiry || t.subscriptionStatus === 'Pending Checkout') return false;
      const days = (new Date(t.planExpiry) - now) / (1000 * 60 * 60 * 24);
      return days > 0 && days <= 30;
    }).length;

    const expiringIn15 = nonDefaultTenants.filter(t => {
      if (!t.planExpiry || t.subscriptionStatus === 'Pending Checkout') return false;
      const days = (new Date(t.planExpiry) - now) / (1000 * 60 * 60 * 24);
      return days > 0 && days <= 15;
    }).length;

    // Plan distribution
    const planBreakdown = {
      'Home User': nonDefaultTenants.filter(t => t.plan === 'Home User').length,
      'MSME': nonDefaultTenants.filter(t => t.plan === 'MSME').length,
      'Large Scale': nonDefaultTenants.filter(t => t.plan === 'Large Scale').length,
    };

    // Revenue & Invoice analytics from Invoices collection
    const [allInvoices, recentInvoices, allCoupons] = await Promise.all([
      Invoice.find({}).setOptions({ bypassTenantFilter: true }),
      Invoice.find({}).setOptions({ bypassTenantFilter: true }).sort({ createdAt: -1 }).limit(25),
      Coupon.find({}).setOptions({ bypassTenantFilter: true }),
    ]);

    const paidInvoices = allInvoices.filter(i => i.status === 'Paid');
    const pendingInvoices = allInvoices.filter(i => i.status === 'Pending');
    const failedInvoices = allInvoices.filter(i => i.status === 'Failed');

    const totalRevenue = paidInvoices.reduce((acc, inv) => acc + (inv.totalAmount || 0), 0);
    const totalTaxable = paidInvoices.reduce((acc, inv) => acc + (inv.taxableAmount || 0), 0);
    const totalTax = paidInvoices.reduce((acc, inv) => acc + ((inv.cgst || 0) + (inv.sgst || 0) + (inv.igst || 0)), 0);

    const activeCoupons = allCoupons.filter(c => c.isActive && (!c.expiryDate || new Date(c.expiryDate) > now)).length;
    const expiredCoupons = allCoupons.filter(c => c.expiryDate && new Date(c.expiryDate) <= now).length;
    const totalCouponUsage = allCoupons.reduce((acc, c) => acc + (c.usedCount || 0), 0);

    const tenantStats = nonDefaultTenants.map((tenant) => {
      const daysRemaining = tenant.planExpiry ? Math.ceil((new Date(tenant.planExpiry) - now) / (1000 * 60 * 60 * 24)) : null;
      const isQuoteExpired = Boolean(tenant.customQuoteExpiry && new Date(tenant.customQuoteExpiry) <= now);
      const customQuoteDaysRemaining = tenant.customQuoteExpiry && !isQuoteExpired
        ? Math.max(1, Math.ceil((new Date(tenant.customQuoteExpiry) - now) / (1000 * 60 * 60 * 24)))
        : null;

      return {
        _id: tenant._id,
        name: tenant.name,
        slug: tenant.slug,
        customerType: tenant.customerType || 'Business',
        plan: tenant.plan,
        subscriptionStatus: tenant.subscriptionStatus || 'Active',
        isActive: tenant.isActive,
        branding: tenant.branding,
        limits: tenant.limits,
        features: tenant.features,
        planExpiry: tenant.planExpiry,
        daysRemaining,
        licenseKey: tenant.licenseKey,
        customPrice: isQuoteExpired ? null : tenant.customPrice,
        customQuoteExpiry: tenant.customQuoteExpiry,
        customQuoteDaysRemaining,
        customQuotePlan: tenant.customQuotePlan,
        allowAddonAssets: tenant.allowAddonAssets ?? false,
        addonAssetPrice: tenant.addonAssetPrice ?? 49,
        addonAssets: tenant.addonAssets || 0,
        gstNumber: tenant.gstNumber,
        address: tenant.address,
        contactEmail: tenant.contactEmail,
        phone: tenant.phone,
        createdAt: tenant.createdAt,
        scheduledDowngrade: tenant.scheduledDowngrade?.plan ? {
          plan: tenant.scheduledDowngrade.plan,
          effectiveDate: tenant.scheduledDowngrade.effectiveDate,
          scheduledAt: tenant.scheduledDowngrade.scheduledAt,
        } : null,
        usage: {
          assets: tenant.limits?.maxAssets || 0,
          users: tenant.limits?.maxUsers || 0,
          tickets: 0,
        },
      };
    });

    const totalAssets = tenantStats.reduce((a, t) => a + (typeof t.usage.assets === 'number' ? t.usage.assets : 0), 0);
    const totalUsers = tenantStats.reduce((a, t) => a + (typeof t.usage.users === 'number' ? t.usage.users : 0), 0);
    const totalAddonAssets = tenantStats.reduce((a, t) => a + (Number(t.addonAssets) || 0), 0);

    res.json({
      platform: {
        totalTenants,
        activeSubscriptions,
        expiringIn30,
        expiringIn15,
        expiredSubscriptions,
        cancelledSubscriptions,
        pendingCheckout,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalTaxable: Math.round(totalTaxable * 100) / 100,
        totalTax: Math.round(totalTax * 100) / 100,
        paidInvoicesCount: paidInvoices.length,
        pendingInvoicesCount: pendingInvoices.length,
        failedInvoicesCount: failedInvoices.length,
        totalCoupons: allCoupons.length,
        activeCoupons,
        expiredCoupons,
        totalCouponUsage,
        totalUsers,
        totalAssets,
        totalAddonAssets,
        planBreakdown,
      },
      tenants: tenantStats,
      recentInvoices: recentInvoices.map(inv => ({
        _id: inv._id,
        invoiceNumber: inv.invoiceNumber,
        tenantId: inv.tenantId,
        companyName: inv.companyName || '—',
        planName: inv.planName,
        baseAmount: inv.baseAmount,
        discountAmount: inv.discountAmount || 0,
        taxableAmount: inv.taxableAmount,
        cgst: inv.cgst || 0,
        sgst: inv.sgst || 0,
        igst: inv.igst || 0,
        totalAmount: inv.totalAmount,
        status: inv.status,
        date: inv.date || inv.createdAt,
        razorpayPaymentId: inv.razorpayPaymentId || inv.paymentReference || '—',
        razorpayOrderId: inv.razorpayOrderId || '—',
      })),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── GET /api/super-admin/expiry-monitoring ──────────────────────────────────
const getExpiryMonitoring = async (req, res) => {
  try {
    const tenants = await Tenant.find({ slug: { $ne: 'default' } }).setOptions({ bypassTenantFilter: true });
    const now = new Date();

    const list = tenants.map((tenant) => {
      const daysRemaining = tenant.planExpiry
        ? Math.ceil((new Date(tenant.planExpiry) - now) / (1000 * 60 * 60 * 24))
        : null;

      let urgency = 'ACTIVE';
      if (!tenant.planExpiry || tenant.subscriptionStatus === 'Pending Checkout') {
        urgency = 'PENDING';
      } else if (daysRemaining <= 0 || tenant.subscriptionStatus === 'Expired') {
        urgency = 'EXPIRED';
      } else if (daysRemaining <= 15) {
        urgency = 'URGENT_15';
      } else if (daysRemaining <= 30) {
        urgency = 'WARNING_30';
      }

      return {
        _id: tenant._id,
        name: tenant.name,
        slug: tenant.slug,
        customerName: tenant.name,
        plan: tenant.plan || 'None',
        subscriptionStatus: tenant.subscriptionStatus || 'Pending Checkout',
        startDate: tenant.createdAt,
        expiryDate: tenant.planExpiry,
        daysRemaining,
        urgency,
        contactEmail: tenant.contactEmail || '',
        contactPhone: tenant.phone || '',
        licenseKey: tenant.licenseKey,
        address: tenant.address,
        gstNumber: tenant.gstNumber,
        scheduledDowngrade: tenant.scheduledDowngrade?.plan ? {
          plan: tenant.scheduledDowngrade.plan,
          effectiveDate: tenant.scheduledDowngrade.effectiveDate,
          scheduledAt: tenant.scheduledDowngrade.scheduledAt,
        } : null,
      };
    });

    // Sort by urgency: EXPIRED (1), URGENT_15 (2), WARNING_30 (3), PENDING (4), ACTIVE (5)
    const urgencyOrder = { EXPIRED: 1, URGENT_15: 2, WARNING_30: 3, PENDING: 4, ACTIVE: 5 };
    list.sort((a, b) => {
      const orderDiff = (urgencyOrder[a.urgency] || 99) - (urgencyOrder[b.urgency] || 99);
      if (orderDiff !== 0) return orderDiff;
      if (a.daysRemaining !== null && b.daysRemaining !== null) {
        return a.daysRemaining - b.daysRemaining;
      }
      return 0;
    });

    res.json(list);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── GET /api/super-admin/tenants/:id/details ────────────────────────────────
const getTenantDetails = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id).setOptions({ bypassTenantFilter: true });
    if (!tenant) return res.status(404).json({ message: 'Tenant not found.' });

    const now = new Date();
    const daysRemaining = tenant.planExpiry
      ? Math.ceil((new Date(tenant.planExpiry) - now) / (1000 * 60 * 60 * 24))
      : null;

    // Fetch invoices for this tenant
    const invoices = await Invoice.find({ tenantId: tenant._id })
      .setOptions({ bypassTenantFilter: true })
      .sort({ date: -1 });

    // Fetch subscription history
    const history = await SubscriptionHistory.find({ tenantId: tenant._id })
      .setOptions({ bypassTenantFilter: true })
      .sort({ date: -1 });

    // Fetch users
    let users = [];
    try {
      users = await User.find({ tenantId: tenant.slug }).setOptions({ bypassTenantFilter: true }).select('-password').sort({ createdAt: -1 });
    } catch {}

    const totalPaid = invoices
      .filter(i => i.status === 'Paid')
      .reduce((acc, i) => acc + (i.totalAmount || 0), 0);

    res.json({
      tenant: {
        _id: tenant._id,
        name: tenant.name,
        slug: tenant.slug,
        customerType: tenant.customerType || 'Business',
        plan: tenant.plan,
        subscriptionStatus: tenant.subscriptionStatus,
        planExpiry: tenant.planExpiry,
        daysRemaining,
        licenseKey: tenant.licenseKey,
        customPrice: tenant.customPrice,
        customQuoteExpiry: tenant.customQuoteExpiry,
        customQuoteDaysRemaining: tenant.customQuoteExpiry && new Date(tenant.customQuoteExpiry) > now
          ? Math.max(1, Math.ceil((new Date(tenant.customQuoteExpiry) - now) / (1000 * 60 * 60 * 24)))
          : null,
        customQuotePlan: tenant.customQuotePlan,
        customQuoteQuotas: tenant.customQuoteQuotas,
        customQuoteFeatures: tenant.customQuoteFeatures,
        limits: tenant.limits,
        features: tenant.features,
        allowAddonAssets: Boolean(tenant.allowAddonAssets),
        addonAssetPrice: tenant.addonAssetPrice || 49,
        addonAssets: tenant.addonAssets || 0,
        address: tenant.address,
        gstNumber: tenant.gstNumber,
        panNumber: tenant.panNumber,
        contactEmail: tenant.contactEmail,
        phone: tenant.phone,
        isActive: tenant.isActive,
        createdAt: tenant.createdAt,
      },
      stats: {
        totalPaid: Math.round(totalPaid * 100) / 100,
        totalInvoices: invoices.length,
        userCount: users.length,
      },
      users,
      invoices,
      history,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── POST /api/super-admin/tenants/:id/subscription-action ───────────────────
const manageTenantSubscription = async (req, res) => {
  try {
    const {
      action,
      plan,
      additionalDays,
      newExpiryDate,
      status,
      notes,
      maxAssets,
      maxUsers,
      maxDepartments,
      limits,
      features,
      customPrice,
      allowAddonAssets,
      addonAssetPrice
    } = req.body;

    const tenant = await Tenant.findById(req.params.id).setOptions({ bypassTenantFilter: true });
    if (!tenant) return res.status(404).json({ message: 'Tenant not found.' });

    const prevPlan = tenant.plan;
    let historyAction = action || 'Admin Override';

    const isCustom = Boolean(plan && (plan.toLowerCase().includes('custom') || plan.includes('CUSTOM')));
    const hasCustomQuote = customPrice !== undefined && customPrice !== null && customPrice !== '' && Number(customPrice) > 0;

    if (isCustom || hasCustomQuote) {
      // 1. Assign bespoke custom quote with strict 7-day payment validity window
      tenant.customPrice = Number(customPrice || 0);
      tenant.customQuoteExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      tenant.customQuoteCreatedAt = new Date();
      tenant.customQuotePlan = plan || 'Custom Enterprise Plan';
      tenant.customQuoteQuotas = {
        maxAssets: maxAssets === 'unlimited' || maxAssets === -1 || maxAssets === '-1' ? -1 : (maxAssets !== '' && maxAssets !== undefined ? Number(maxAssets) : -1),
        maxUsers: maxUsers === 'unlimited' || maxUsers === -1 || maxUsers === '-1' ? -1 : (maxUsers !== '' && maxUsers !== undefined ? Number(maxUsers) : -1),
        maxDepartments: maxDepartments === 'unlimited' || maxDepartments === -1 || maxDepartments === '-1' ? -1 : (maxDepartments !== '' && maxDepartments !== undefined ? Number(maxDepartments) : -1),
      };
      tenant.customQuoteFeatures = features || {};

      // Do NOT switch tenant.plan to custom plan yet if payment has not been collected
      if (status) {
        tenant.subscriptionStatus = status;
      }
    } else {
      // Standard plan override
      tenant.customPrice = null;
      tenant.customQuoteExpiry = null;
      tenant.customQuotePlan = null;
      tenant.customQuoteQuotas = null;
      tenant.customQuoteFeatures = null;

      if (plan) {
        tenant.plan = plan;
        const planService = require('../services/planService');
        const dbPlan = await planService.getPlanByKey(plan);
        const { getPlanDefaults } = require('../config/planDefaults');
        const planDefaults = getPlanDefaults(plan);

        tenant.limits = tenant.limits || {};
        tenant.limits.maxAssets = dbPlan?.maxAssets !== undefined ? dbPlan.maxAssets : planDefaults.maxAssets;
        tenant.limits.maxUsers = dbPlan?.maxUsers !== undefined ? dbPlan.maxUsers : planDefaults.maxUsers;
        tenant.limits.maxDepartments = dbPlan?.maxDepartments !== undefined ? dbPlan.maxDepartments : (planDefaults.maxDepartments || 2);
        tenant.features = {
          ...(tenant.features || {}),
          ...(dbPlan?.featureFlags || planDefaults.features || {})
        };
      }

      if (limits && typeof limits === 'object') {
        tenant.limits = { ...(tenant.limits || {}), ...limits };
      }
      if (maxAssets !== undefined && maxAssets !== '') {
        tenant.limits = tenant.limits || {};
        tenant.limits.maxAssets = maxAssets === 'unlimited' || maxAssets === -1 || maxAssets === '-1' ? -1 : Number(maxAssets);
      }
      if (maxUsers !== undefined && maxUsers !== '') {
        tenant.limits = tenant.limits || {};
        tenant.limits.maxUsers = maxUsers === 'unlimited' || maxUsers === -1 || maxUsers === '-1' ? -1 : Number(maxUsers);
      }
      if (maxDepartments !== undefined && maxDepartments !== '') {
        tenant.limits = tenant.limits || {};
        tenant.limits.maxDepartments = maxDepartments === 'unlimited' || maxDepartments === -1 || maxDepartments === '-1' ? -1 : Number(maxDepartments);
      }
      if (features && typeof features === 'object') {
        tenant.features = { ...(tenant.features || {}), ...features };
      }

      if (status) {
        tenant.subscriptionStatus = status;
      }
    }

    if (newExpiryDate) {
      tenant.planExpiry = new Date(newExpiryDate);
    } else if (additionalDays && Number(additionalDays) > 0) {
      const baseDate = tenant.planExpiry && new Date(tenant.planExpiry) > new Date() ? new Date(tenant.planExpiry) : new Date();
      baseDate.setDate(baseDate.getDate() + Number(additionalDays));
      tenant.planExpiry = baseDate;
    }

    if (!tenant.licenseKey) {
      tenant.licenseKey = generateLicenseKey(tenant.slug);
    }

    if (allowAddonAssets !== undefined) {
      tenant.allowAddonAssets = Boolean(allowAddonAssets);
    }
    if (addonAssetPrice !== undefined && !isNaN(Number(addonAssetPrice))) {
      tenant.addonAssetPrice = Number(addonAssetPrice);
    }

    tenant.markModified('limits');
    tenant.markModified('features');
    await tenant.save();

    // Record subscription history
    await SubscriptionHistory.create({
      tenantId: tenant._id,
      action: historyAction,
      previousPlan: prevPlan,
      newPlan: tenant.plan,
      amountPaid: 0,
      notes: notes || `Admin action: ${historyAction}`,
    });

    res.json({ message: `Subscription updated for "${tenant.name}".`, tenant });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── POST /api/super-admin/tenants ─────────────────────────────────────────
const createTenant = async (req, res) => {
  try {
    const { name, slug, plan, maxAssets, maxUsers, adminEmail, adminName, adminPassword, address, city, state, pinCode, gstNumber } = req.body;

    if (!name || !slug || !adminEmail || !adminName || !adminPassword) {
      return res.status(400).json({ message: 'name, slug, adminEmail, adminName, and adminPassword are required.' });
    }

    const cleanSlug = slug.toLowerCase().trim();
    const exists = await Tenant.findOne({ slug: cleanSlug }).setOptions({ bypassTenantFilter: true });
    if (exists) {
      return res.status(400).json({ message: `A company with slug "${cleanSlug}" already exists.` });
    }

    const selectedPlan = plan || 'MSME';
    const planDefaults = getPlanDefaults(selectedPlan);
    const licenseKey = generateLicenseKey(cleanSlug);

    const periodEnd = new Date();
    periodEnd.setFullYear(periodEnd.getFullYear() + 1);

    const tenant = await Tenant.create({
      name,
      slug: cleanSlug,
      plan: selectedPlan,
      licenseKey,
      subscriptionStatus: 'Active',
      planExpiry: periodEnd,
      address: {
        line: address || '',
        city: city || '',
        state: state || 'Maharashtra',
        pin: pinCode || '',
        country: 'India',
      },
      gstNumber: gstNumber || null,
      limits: {
        maxAssets: maxAssets ?? planDefaults.maxAssets,
        maxUsers: maxUsers ?? planDefaults.maxUsers,
      },
      features: planDefaults.features,
    });

    // Provision the tenant DB and create admin user
    const tenantConn = getTenantConnection(tenant.slug);
    const TenantUser = tenantConn.model('User');
    const DepartmentModel = tenantConn.model('Department');

    await DepartmentModel.create({
      name: 'IT',
      code: 'IT',
      hodName: adminName,
      hodEmail: adminEmail,
      status: 'Active',
      tenantId: cleanSlug,
    }).catch(() => {});

    await TenantUser.create({
      name: adminName,
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
      tenantId: cleanSlug,
      department: 'IT',
      isActive: true,
    });

    await User.create({
      name: adminName,
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
      tenantId: cleanSlug,
      department: 'IT',
      isActive: true,
    }).catch(() => {});

    // Record initial history
    await SubscriptionHistory.create({
      tenantId: tenant._id,
      action: 'Subscribed',
      previousPlan: null,
      newPlan: selectedPlan,
      amountPaid: 0,
      notes: 'Provisioned by Super Admin',
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
    const tenant = await Tenant.findById(req.params.id).setOptions({ bypassTenantFilter: true });
    if (!tenant) return res.status(404).json({ message: 'Tenant not found.' });

    tenant.isActive = !tenant.isActive;
    await tenant.save();

    try {
      const { invalidateTenantCache } = require('../middleware/tenantMiddleware');
      invalidateTenantCache(tenant.slug);
    } catch {}

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
    const { plan, maxAssets, maxUsers, features, planExpiry, allowAddonAssets, addonAssetPrice } = req.body;
    const tenant = await Tenant.findById(req.params.id).setOptions({ bypassTenantFilter: true });
    if (!tenant) return res.status(404).json({ message: 'Tenant not found.' });

    if (plan && plan !== tenant.plan) {
      const planDefaults = getPlanDefaults(plan);
      tenant.plan = plan;
      tenant.limits.maxAssets = planDefaults.maxAssets;
      tenant.limits.maxUsers = planDefaults.maxUsers;
      tenant.features = planDefaults.features;
    }
    if (maxAssets !== undefined) tenant.limits.maxAssets = maxAssets;
    if (maxUsers !== undefined) tenant.limits.maxUsers = maxUsers;
    if (features) tenant.features = { ...tenant.features, ...features };
    if (planExpiry !== undefined) tenant.planExpiry = planExpiry ? new Date(planExpiry) : null;
    if (allowAddonAssets !== undefined) tenant.allowAddonAssets = Boolean(allowAddonAssets);
    if (addonAssetPrice !== undefined && !isNaN(Number(addonAssetPrice))) tenant.addonAssetPrice = Number(addonAssetPrice);

    await tenant.save();
    res.json({ message: `Plan and settings updated for "${tenant.name}".`, tenant });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── DELETE /api/super-admin/tenants/:id ───────────────────────────────────
const deleteTenant = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id).setOptions({ bypassTenantFilter: true });
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
    const tenant = await Tenant.findById(req.params.id).setOptions({ bypassTenantFilter: true });
    if (!tenant) return res.status(404).json({ message: 'Tenant not found.' });

    const TenantUser = getTenantModel(tenant.slug, 'User');
    let users = await TenantUser.find({}).setOptions({ bypassTenantFilter: true }).select('-password').sort({ createdAt: -1 });
    if (!users || users.length === 0) {
      users = await User.find({ tenantId: tenant.slug }).setOptions({ bypassTenantFilter: true }).select('-password');
    }
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── COUPON MANAGEMENT (SUPER ADMIN) ─────────────────────────────────────────

// GET /api/super-admin/coupons
const getCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().setOptions({ bypassTenantFilter: true }).sort({ createdAt: -1 });
    res.json(coupons);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/super-admin/coupons
const createCoupon = async (req, res) => {
  try {
    const {
      code,
      description,
      discountType,
      discountValue,
      minOrderValue,
      maxDiscount,
      applicablePlans,
      startDate,
      expiryDate,
      maxUsage,
      isActive,
    } = req.body;

    if (!code || !discountType || discountValue === undefined) {
      return res.status(400).json({ message: 'Coupon code, discount type, and discount value are required.' });
    }

    const cleanCode = code.toUpperCase().trim();
    const existing = await Coupon.findOne({ code: cleanCode }).setOptions({ bypassTenantFilter: true });
    if (existing) {
      return res.status(400).json({ message: `Coupon code "${cleanCode}" already exists.` });
    }

    const coupon = await Coupon.create({
      code: cleanCode,
      description: description || '',
      discountType,
      discountValue: Number(discountValue),
      minOrderValue: Number(minOrderValue) || 0,
      maxDiscount: maxDiscount ? Number(maxDiscount) : null,
      applicablePlans: Array.isArray(applicablePlans) && applicablePlans.length > 0 ? applicablePlans : ['ALL'],
      startDate: startDate ? new Date(startDate) : new Date(),
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      maxUsage: maxUsage ? Number(maxUsage) : null,
      isActive: isActive !== false,
    });

    res.status(201).json({ message: `Coupon "${cleanCode}" created successfully.`, coupon });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/super-admin/coupons/:id
const updateCoupon = async (req, res) => {
  try {
    const {
      code,
      description,
      discountType,
      discountValue,
      minOrderValue,
      maxDiscount,
      applicablePlans,
      startDate,
      expiryDate,
      maxUsage,
      isActive,
    } = req.body;

    let coupon = null;
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      coupon = await Coupon.findById(req.params.id).setOptions({ bypassTenantFilter: true });
    }
    if (!coupon && code) {
      coupon = await Coupon.findOne({ code: code.toUpperCase().trim() }).setOptions({ bypassTenantFilter: true });
    }
    if (!coupon) return res.status(404).json({ message: 'Coupon not found.' });

    if (code) coupon.code = code.toUpperCase().trim();
    if (description !== undefined) coupon.description = description;
    if (discountType) coupon.discountType = discountType;
    if (discountValue !== undefined) coupon.discountValue = Number(discountValue);
    if (minOrderValue !== undefined) coupon.minOrderValue = Number(minOrderValue);
    if (maxDiscount !== undefined) coupon.maxDiscount = maxDiscount ? Number(maxDiscount) : null;
    if (applicablePlans) coupon.applicablePlans = applicablePlans;
    if (startDate !== undefined) coupon.startDate = startDate ? new Date(startDate) : coupon.startDate;
    if (expiryDate !== undefined) coupon.expiryDate = expiryDate ? new Date(expiryDate) : null;
    if (maxUsage !== undefined) coupon.maxUsage = maxUsage ? Number(maxUsage) : null;
    if (isActive !== undefined) coupon.isActive = Boolean(isActive);

    await coupon.save();
    res.json({ message: `Coupon "${coupon.code}" updated successfully.`, coupon });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PATCH /api/super-admin/coupons/:id/toggle
const toggleCouponStatus = async (req, res) => {
  try {
    let coupon = null;
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      coupon = await Coupon.findById(req.params.id).setOptions({ bypassTenantFilter: true });
    }
    if (!coupon) return res.status(404).json({ message: 'Coupon not found.' });

    coupon.isActive = !coupon.isActive;
    await coupon.save();

    res.json({
      message: `Coupon "${coupon.code}" has been ${coupon.isActive ? 'activated' : 'deactivated'}.`,
      coupon,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/super-admin/coupons/:id
const deleteCoupon = async (req, res) => {
  try {
    let coupon = null;
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      coupon = await Coupon.findByIdAndDelete(req.params.id).setOptions({ bypassTenantFilter: true });
    }
    if (!coupon) return res.status(404).json({ message: 'Coupon not found.' });

    res.json({ message: `Coupon "${coupon.code}" deleted.` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Plan Management Controllers ───────────────────────────────────────────

// GET /api/super-admin/plans (returns all active and custom/inactive plans)
const getPlans = async (req, res) => {
  try {
    const planService = require('../services/planService');
    const plans = await planService.getAllPlans(true);
    res.json(plans);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/super-admin/plans (create new plan or custom bespoke plan)
const createPlan = async (req, res) => {
  try {
    const planService = require('../services/planService');
    const plan = await planService.createPlan(req.body);
    res.status(201).json({
      message: `Plan "${plan.name}" created successfully.`,
      plan
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// PUT /api/super-admin/plans/:planKey
const updatePlan = async (req, res) => {
  try {
    const planService = require('../services/planService');
    const { planKey } = req.params;
    const updated = await planService.updatePlan(planKey, req.body);
    res.json({
      message: `Plan "${updated.name}" updated successfully.`,
      plan: updated
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// PATCH /api/super-admin/plans/:planKey/toggle
const togglePlanStatus = async (req, res) => {
  try {
    const planService = require('../services/planService');
    const { planKey } = req.params;
    const plan = await planService.togglePlanStatus(planKey);
    res.json({
      message: `Plan "${plan.name}" is now ${plan.isActive ? 'Active' : 'Disabled'}.`,
      plan
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// DELETE /api/super-admin/plans/:planKey
const deletePlan = async (req, res) => {
  try {
    const planService = require('../services/planService');
    const { planKey } = req.params;
    const deleted = await planService.deletePlan(planKey);
    res.json({
      message: `Plan "${deleted.name}" has been deleted.`,
      plan: deleted
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// POST /api/super-admin/plans/reset
const resetPlans = async (req, res) => {
  try {
    const planService = require('../services/planService');
    const reset = await planService.resetPlansToDefault();
    res.json({
      message: 'All subscription plans reset to default prices and specifications.',
      plans: reset
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Universal Platform Settings (Add-on Assets & Universal Controls) ────────
const GlobalSetting = require('../models/GlobalSetting');

// GET /api/super-admin/global-settings
const getGlobalSettings = async (req, res) => {
  try {
    let setting = await GlobalSetting.findOne({ key: 'platform_settings' });
    if (!setting) {
      setting = await GlobalSetting.create({
        key: 'platform_settings',
        allowAddonAssets: true,
        addonAssetPrice: 49,
      });
    }
    res.json(setting);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/super-admin/global-settings
const updateGlobalSettings = async (req, res) => {
  try {
    const { allowAddonAssets, addonAssetPrice, applyToAllCompanies } = req.body;
    let setting = await GlobalSetting.findOne({ key: 'platform_settings' });
    if (!setting) {
      setting = new GlobalSetting({ key: 'platform_settings' });
    }

    if (allowAddonAssets !== undefined) {
      setting.allowAddonAssets = Boolean(allowAddonAssets);
    }
    if (addonAssetPrice !== undefined && !isNaN(Number(addonAssetPrice))) {
      setting.addonAssetPrice = Number(addonAssetPrice);
    }

    await setting.save();

    // If applyToAllCompanies is true (or universally applied)
    if (applyToAllCompanies !== false) {
      const updateData = {};
      if (allowAddonAssets !== undefined) updateData.allowAddonAssets = Boolean(allowAddonAssets);
      if (addonAssetPrice !== undefined && !isNaN(Number(addonAssetPrice))) updateData.addonAssetPrice = Number(addonAssetPrice);
      
      await Tenant.updateMany({}, { $set: updateData }).setOptions({ bypassTenantFilter: true });
    }

    res.json({
      message: 'Universal platform settings saved and applied across all companies successfully.',
      setting,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
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
};


