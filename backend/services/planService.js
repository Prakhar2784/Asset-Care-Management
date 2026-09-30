// backend/services/planService.js
const PlanConfig = require('../models/PlanConfig');
const billingConfig = require('../config/billingConfig');

const DEFAULT_PLANS = [
  {
    planKey: 'HOME_USER',
    name: 'Home User',
    price: 999,
    billingCycle: 'yearly',
    maxAssets: 20,
    maxUsers: 3,
    maxDepartments: 2,
    description: 'Up to 20 assets for personal or small home office equipment tracking',
    badge: 'Popular for Personal',
    features: [
      'Up to 20 Assets',
      'Up to 3 Users',
      'Up to 2 Departments',
      'Core inventory and QR tagging',
      'Ticketing (basic requests)',
      'Standard reports',
      'Email notifications'
    ],
    featureFlags: {
      coreInventory: true,
      ticketing: 'basic',
      standardReports: true,
      advancedAnalytics: false,
      warrantyTracking: false,
      bulkCsvImport: false,
      slaEscalation: false,
      customBranding: false,
      auditTrail: false,
      dedicatedSupport: false,
    },
    isActive: true,
    isCustom: false,
    order: 1
  },
  {
    planKey: 'MSME',
    name: 'MSME',
    price: 2999,
    billingCycle: 'yearly',
    maxAssets: 50,
    maxUsers: 15,
    maxDepartments: 5,
    description: 'Up to 50 assets with multi-department support and warranty radar for growing businesses',
    badge: 'Most Popular',
    features: [
      'Up to 50 Assets',
      'Up to 15 Users',
      'Up to 5 Departments',
      'Core inventory and QR tagging',
      'Ticketing (full workflows)',
      'Standard reports',
      'Advanced analytics',
      'Warranty tracking & Radar',
      'Bulk CSV import'
    ],
    featureFlags: {
      coreInventory: true,
      ticketing: 'full',
      standardReports: true,
      advancedAnalytics: true,
      warrantyTracking: true,
      bulkCsvImport: true,
      slaEscalation: false,
      customBranding: false,
      auditTrail: false,
      dedicatedSupport: false,
    },
    isActive: true,
    isCustom: false,
    order: 2
  },
  {
    planKey: 'LARGE_SCALE',
    name: 'Large Scale',
    price: 8999,
    billingCycle: 'yearly',
    maxAssets: -1, // -1 represents unlimited
    maxUsers: -1,
    maxDepartments: -1,
    description: 'Unlimited assets with REST API, custom branding, full audit trail, and priority SLA support',
    badge: 'Enterprise',
    features: [
      'Unlimited Assets',
      'Unlimited Users',
      'Unlimited Departments',
      'Core inventory and QR tagging',
      'Ticketing (full workflows)',
      'Standard reports',
      'Advanced analytics',
      'Warranty tracking & Radar',
      'Bulk CSV import',
      'SLA escalation engine',
      'Custom branding & company logo',
      'Full audit trail logs',
      'Dedicated priority support'
    ],
    featureFlags: {
      coreInventory: true,
      ticketing: 'full',
      standardReports: true,
      advancedAnalytics: true,
      warrantyTracking: true,
      bulkCsvImport: true,
      slaEscalation: true,
      customBranding: true,
      auditTrail: true,
      dedicatedSupport: true,
    },
    isActive: true,
    isCustom: false,
    order: 3
  },
  {
    planKey: 'CUSTOM_ENTERPRISE',
    name: 'Custom Enterprise Plan',
    price: 0,
    billingCycle: 'yearly',
    maxAssets: -1,
    maxUsers: -1,
    maxDepartments: -1,
    description: 'Custom tailored plan configured with bespoke quotas and enabled capabilities as per requirement',
    badge: 'Custom Tailored',
    features: [
      'As per requirement Users',
      'As per requirement Departments',
      'As per requirement Assets',
      'Core inventory and QR tagging',
      'Custom ticketing & approval workflows',
      'SLA escalation engine',
      'Custom branding & white-labeling',
      'Full audit trail logs',
      'Dedicated priority support & Account Manager'
    ],
    featureFlags: {
      coreInventory: true,
      ticketing: 'full',
      standardReports: true,
      advancedAnalytics: true,
      warrantyTracking: true,
      bulkCsvImport: true,
      slaEscalation: true,
      customBranding: true,
      auditTrail: true,
      dedicatedSupport: true,
    },
    isActive: true,
    isCustom: true,
    order: 4
  }
];

/**
 * Ensures default plans exist in the database with modern featureFlags ONLY on initial DB setup
 */
const initPlanConfigs = async () => {
  try {
    const count = await PlanConfig.countDocuments({}).setOptions({ bypassTenantFilter: true });
    // Only seed default plans if the platform has no plans configured yet (first boot)
    if (count === 0) {
      for (const plan of DEFAULT_PLANS) {
        await PlanConfig.create(plan);
      }
      console.log('[PlanConfig] Initialized default subscription plans on first setup.');
    }
  } catch (err) {
    console.error('Error initializing plan configurations:', err.message);
  }
};

/**
 * Retrieve plans (active only for public, all for super admin)
 */
const getAllPlans = async (includeInactive = false) => {
  try {
    const totalCount = await PlanConfig.countDocuments({}).setOptions({ bypassTenantFilter: true });
    if (totalCount === 0) {
      await initPlanConfigs();
    }

    const filter = includeInactive ? {} : { isActive: true };
    let plans = await PlanConfig.find(filter)
      .sort({ order: 1, createdAt: 1 })
      .setOptions({ bypassTenantFilter: true });

    let result = plans.map(p => p.toObject ? p.toObject() : p);

    // If superadmin has configured plans, return them as is
    return result;
  } catch (err) {
    console.error('getAllPlans error, falling back to static defaults:', err.message);
    return includeInactive ? DEFAULT_PLANS : DEFAULT_PLANS.filter(p => p.isActive);
  }
};

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Retrieve a specific plan by key or name
 */
const getPlanByKey = async (keyOrName) => {
  if (!keyOrName) return (await getAllPlans())[0];
  const stripped = keyOrName.toString().replace(/\s*\(\+?\d+.*?\)\s*/g, '').trim();
  const clean = stripped.toUpperCase().replace(/\s+/g, '_');
  
  try {
    let plan = await PlanConfig.findOne({
      $or: [
        { planKey: clean },
        { planKey: stripped.toUpperCase() },
        { name: new RegExp(`^${escapeRegex(stripped)}$`, 'i') },
        { name: new RegExp(`^${escapeRegex(keyOrName.toString().trim())}$`, 'i') }
      ]
    }).setOptions({ bypassTenantFilter: true });

    if (plan) return plan.toObject ? plan.toObject() : plan;

    // Fallback to static defaults
    const all = await getAllPlans(true);
    return all.find(p => 
      p.planKey === clean || 
      p.name.toLowerCase() === stripped.toLowerCase() ||
      p.name.toLowerCase() === keyOrName.toString().toLowerCase()
    ) || all[0];
  } catch (err) {
    console.error('getPlanByKey error:', err.message);
    return DEFAULT_PLANS[0];
  }
};

/**
 * Create a new Plan or Custom Plan (Super Admin)
 */
const createPlan = async (data) => {
  const {
    name,
    planKey,
    price,
    billingCycle = 'yearly',
    maxAssets,
    maxUsers,
    maxDepartments,
    description,
    badge,
    features,
    featureFlags,
    isActive = true,
    isCustom = false,
  } = data;

  if (!name || !name.trim()) throw new Error('Plan name is required.');
  const numPrice = Number(price);
  if (isNaN(numPrice) || numPrice < 0) throw new Error('Price must be a valid non-negative number.');

  let cleanKey = (planKey || name).toString().trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_');
  if (!cleanKey) cleanKey = 'PLAN_' + Date.now();

  const existing = await PlanConfig.findOne({ planKey: cleanKey }).setOptions({ bypassTenantFilter: true });
  if (existing) {
    throw new Error(`A plan with key "${cleanKey}" already exists.`);
  }

  const highestOrder = await PlanConfig.findOne({}).sort({ order: -1 }).select('order').setOptions({ bypassTenantFilter: true });
  const nextOrder = (highestOrder?.order || 0) + 1;

  const newPlan = await PlanConfig.create({
    planKey: cleanKey,
    name: name.trim(),
    price: numPrice,
    billingCycle,
    maxAssets: maxAssets === 'unlimited' || maxAssets === -1 || maxAssets === '-1' ? -1 : (Number(maxAssets) || 20),
    maxUsers: maxUsers === 'unlimited' || maxUsers === -1 || maxUsers === '-1' ? -1 : (Number(maxUsers) || 3),
    maxDepartments: maxDepartments === 'unlimited' || maxDepartments === -1 || maxDepartments === '-1' ? -1 : (Number(maxDepartments) || 2),
    description: description ? description.trim() : '',
    badge: badge ? badge.trim() : '',
    features: Array.isArray(features) ? features.filter(f => typeof f === 'string' && f.trim()) : [],
    featureFlags: featureFlags || {
      coreInventory: true,
      ticketing: 'basic',
      standardReports: true,
      advancedAnalytics: false,
      warrantyTracking: false,
      bulkCsvImport: false,
      slaEscalation: false,
      customBranding: false,
      auditTrail: false,
      dedicatedSupport: false,
    },
    isActive: Boolean(isActive),
    isCustom: Boolean(isCustom),
    order: nextOrder,
  });

  return newPlan;
};

/**
 * Update plan price, quotas, and feature flags (Super Admin only)
 */
const updatePlan = async (planKey, updateData) => {
  const cleanKey = planKey.toString().trim().toUpperCase().replace(/\s+/g, '_');
  
  let existing = await PlanConfig.findOne({ planKey: cleanKey }).setOptions({ bypassTenantFilter: true });
  if (!existing) {
    await initPlanConfigs();
    existing = await PlanConfig.findOne({ planKey: cleanKey }).setOptions({ bypassTenantFilter: true });
  }

  const fieldsToUpdate = {};
  if (updateData.price !== undefined) {
    const numPrice = Number(updateData.price);
    if (isNaN(numPrice) || numPrice < 0) throw new Error('Price must be a valid non-negative number');
    fieldsToUpdate.price = numPrice;
  }
  if (updateData.name !== undefined && updateData.name.trim()) {
    fieldsToUpdate.name = updateData.name.trim();
  }
  if (updateData.planKey !== undefined && updateData.planKey.toString().trim()) {
    const cleanNewKey = updateData.planKey.toString().trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_');
    if (cleanNewKey && cleanNewKey !== cleanKey) {
      const conflict = await PlanConfig.findOne({ planKey: cleanNewKey }).setOptions({ bypassTenantFilter: true });
      if (conflict && conflict._id.toString() !== existing._id?.toString()) {
        throw new Error(`A plan with key "${cleanNewKey}" already exists.`);
      }
      fieldsToUpdate.planKey = cleanNewKey;
    }
  }
  if (updateData.description !== undefined) {
    fieldsToUpdate.description = updateData.description.trim();
  }
  if (updateData.maxAssets !== undefined) {
    fieldsToUpdate.maxAssets = updateData.maxAssets === 'unlimited' || updateData.maxAssets === -1 || updateData.maxAssets === '-1'
      ? -1
      : Number(updateData.maxAssets);
  }
  if (updateData.maxUsers !== undefined) {
    fieldsToUpdate.maxUsers = updateData.maxUsers === 'unlimited' || updateData.maxUsers === -1 || updateData.maxUsers === '-1'
      ? -1
      : Number(updateData.maxUsers);
  }
  if (updateData.maxDepartments !== undefined) {
    fieldsToUpdate.maxDepartments = updateData.maxDepartments === 'unlimited' || updateData.maxDepartments === -1 || updateData.maxDepartments === '-1'
      ? -1
      : Number(updateData.maxDepartments);
  }
  if (updateData.features !== undefined && Array.isArray(updateData.features)) {
    fieldsToUpdate.features = updateData.features.filter(f => typeof f === 'string' && f.trim());
  }
  if (updateData.featureFlags !== undefined && typeof updateData.featureFlags === 'object') {
    fieldsToUpdate.featureFlags = {
      ...(existing?.featureFlags || {}),
      ...updateData.featureFlags
    };
  }
  if (updateData.badge !== undefined) {
    fieldsToUpdate.badge = updateData.badge.trim();
  }
  if (updateData.isActive !== undefined) {
    fieldsToUpdate.isActive = Boolean(updateData.isActive);
  }
  if (updateData.isCustom !== undefined) {
    fieldsToUpdate.isCustom = Boolean(updateData.isCustom);
  }

  const updated = await PlanConfig.findOneAndUpdate(
    { planKey: cleanKey },
    { $set: fieldsToUpdate },
    { new: true, upsert: true }
  ).setOptions({ bypassTenantFilter: true });

  // Update in-memory billingConfig as well for immediate sync
  const effectiveKey = fieldsToUpdate.planKey || cleanKey;
  if (billingConfig.PLANS) {
    if (cleanKey !== effectiveKey && billingConfig.PLANS[cleanKey]) {
      billingConfig.PLANS[effectiveKey] = { ...billingConfig.PLANS[cleanKey] };
      delete billingConfig.PLANS[cleanKey];
    }
    if (billingConfig.PLANS[effectiveKey]) {
      if (fieldsToUpdate.price !== undefined) billingConfig.PLANS[effectiveKey].price = fieldsToUpdate.price;
      if (fieldsToUpdate.name !== undefined) billingConfig.PLANS[effectiveKey].name = fieldsToUpdate.name;
      if (fieldsToUpdate.maxAssets !== undefined) billingConfig.PLANS[effectiveKey].maxAssets = fieldsToUpdate.maxAssets === -1 ? 999999999 : fieldsToUpdate.maxAssets;
    }
  }

  return updated;
};

/**
 * Toggle plan active status
 */
const togglePlanStatus = async (planKey) => {
  const cleanKey = planKey.toString().trim().toUpperCase().replace(/\s+/g, '_');
  const plan = await PlanConfig.findOne({ planKey: cleanKey }).setOptions({ bypassTenantFilter: true });
  if (!plan) throw new Error('Plan not found.');
  plan.isActive = !plan.isActive;
  await plan.save();
  return plan;
};

/**
 * Delete a custom plan
 */
const deletePlan = async (planKey) => {
  const cleanKey = planKey.toString().trim().toUpperCase().replace(/\s+/g, '_');
  const count = await PlanConfig.countDocuments({}).setOptions({ bypassTenantFilter: true });
  if (count <= 1) {
    throw new Error('At least one subscription plan must remain on the platform.');
  }
  const deleted = await PlanConfig.findOneAndDelete({
    $or: [
      { planKey: cleanKey },
      { planKey: planKey.toString().trim() },
      { name: new RegExp(`^${planKey.toString().trim()}$`, 'i') }
    ]
  }).setOptions({ bypassTenantFilter: true });
  if (!deleted) throw new Error('Plan not found.');

  if (billingConfig.PLANS && billingConfig.PLANS[cleanKey]) {
    delete billingConfig.PLANS[cleanKey];
  }

  return deleted;
};

/**
 * Reset all standard plans to original defaults
 */
const resetPlansToDefault = async () => {
  for (const def of DEFAULT_PLANS) {
    await PlanConfig.findOneAndUpdate(
      { planKey: def.planKey },
      { $set: def },
      { upsert: true, new: true }
    ).setOptions({ bypassTenantFilter: true });
    
    if (billingConfig.PLANS && billingConfig.PLANS[def.planKey]) {
      billingConfig.PLANS[def.planKey].price = def.price;
      billingConfig.PLANS[def.planKey].name = def.name;
      billingConfig.PLANS[def.planKey].maxAssets = def.maxAssets === -1 ? 999999999 : def.maxAssets;
    }
  }
  return await getAllPlans(true);
};

module.exports = {
  DEFAULT_PLANS,
  initPlanConfigs,
  getAllPlans,
  getPlanByKey,
  createPlan,
  updatePlan,
  togglePlanStatus,
  deletePlan,
  resetPlansToDefault
};

