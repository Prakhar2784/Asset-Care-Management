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
    maxUsers: 1,
    maxDepartments: 1,
    description: 'Up to 20 assets for personal or small home office equipment tracking',
    badge: 'Popular for Personal',
    features: [
      'Up to 20 Assets',
      '1 Admin User',
      'QR Code Label Generation',
      'Maintenance & Ticket System',
      'Service Center Directory',
      'Email Notifications'
    ],
    isActive: true,
    order: 1
  },
  {
    planKey: 'MSME',
    name: 'MSME',
    price: 2999,
    billingCycle: 'yearly',
    maxAssets: 50,
    maxUsers: 10,
    maxDepartments: -1,
    description: 'Up to 50 assets with multi-department support and warranty radar for growing businesses',
    badge: 'Most Popular',
    features: [
      'Up to 50 Assets',
      'Up to 10 Users',
      'Unlimited Departments',
      'Approval Workflows',
      'Warranty Radar & Alerts',
      'SLA Escalation Engine',
      'Technician Service Logs',
      'Audit Trail Logs'
    ],
    isActive: true,
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
    description: 'Unlimited assets with REST API, custom branding, and priority enterprise support',
    badge: 'Enterprise',
    features: [
      'Unlimited Assets',
      'Unlimited Users',
      'Unlimited Departments',
      'Custom Branding & White-labeling',
      'Developer REST API & Webhooks',
      'Priority 24/7 SLA Support',
      'Advanced Compliance Reports',
      'Dedicated Account Manager'
    ],
    isActive: true,
    order: 3
  }
];

/**
 * Ensures default plans exist in the database
 */
const initPlanConfigs = async () => {
  try {
    const count = await PlanConfig.countDocuments({}).setOptions({ bypassTenantFilter: true });
    if (count === 0) {
      console.log('Seeding default subscription plans into PlanConfig collection...');
      for (const plan of DEFAULT_PLANS) {
        await PlanConfig.findOneAndUpdate(
          { planKey: plan.planKey },
          { $setOnInsert: plan },
          { upsert: true, new: true }
        ).setOptions({ bypassTenantFilter: true });
      }
    }
  } catch (err) {
    console.error('Error initializing plan configurations:', err.message);
  }
};

/**
 * Retrieve all active plans
 */
const getAllPlans = async () => {
  try {
    let plans = await PlanConfig.find({ isActive: true })
      .sort({ order: 1 })
      .setOptions({ bypassTenantFilter: true });

    if (!plans || plans.length === 0) {
      await initPlanConfigs();
      plans = await PlanConfig.find({ isActive: true })
        .sort({ order: 1 })
        .setOptions({ bypassTenantFilter: true });
    }

    if (!plans || plans.length === 0) {
      return DEFAULT_PLANS;
    }

    return plans.map(p => p.toObject ? p.toObject() : p);
  } catch (err) {
    console.error('getAllPlans error, falling back to static defaults:', err.message);
    return DEFAULT_PLANS;
  }
};

/**
 * Retrieve a specific plan by key or name
 */
const getPlanByKey = async (keyOrName) => {
  if (!keyOrName) return (await getAllPlans())[0];
  const clean = keyOrName.toString().trim().toUpperCase().replace(/\s+/g, '_');
  
  try {
    let plan = await PlanConfig.findOne({
      $or: [
        { planKey: clean },
        { planKey: keyOrName.toString().trim().toUpperCase() },
        { name: new RegExp(`^${keyOrName.toString().trim()}$`, 'i') }
      ]
    }).setOptions({ bypassTenantFilter: true });

    if (plan) return plan.toObject ? plan.toObject() : plan;

    // Fallback to static defaults
    const all = await getAllPlans();
    return all.find(p => 
      p.planKey === clean || 
      p.name.toLowerCase() === keyOrName.toString().toLowerCase()
    ) || all[0];
  } catch (err) {
    console.error('getPlanByKey error:', err.message);
    return DEFAULT_PLANS[0];
  }
};

/**
 * Update plan price and attributes (Super Admin only)
 */
const updatePlan = async (planKey, updateData) => {
  const cleanKey = planKey.toString().trim().toUpperCase().replace(/\s+/g, '_');
  
  // Ensure document exists first
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
  if (updateData.description !== undefined) {
    fieldsToUpdate.description = updateData.description.trim();
  }
  if (updateData.maxAssets !== undefined) {
    fieldsToUpdate.maxAssets = Number(updateData.maxAssets);
  }
  if (updateData.maxUsers !== undefined) {
    fieldsToUpdate.maxUsers = Number(updateData.maxUsers);
  }
  if (updateData.features !== undefined && Array.isArray(updateData.features)) {
    fieldsToUpdate.features = updateData.features.filter(f => typeof f === 'string' && f.trim());
  }
  if (updateData.badge !== undefined) {
    fieldsToUpdate.badge = updateData.badge.trim();
  }
  if (updateData.isActive !== undefined) {
    fieldsToUpdate.isActive = Boolean(updateData.isActive);
  }

  const updated = await PlanConfig.findOneAndUpdate(
    { planKey: cleanKey },
    { $set: fieldsToUpdate },
    { new: true, upsert: true }
  ).setOptions({ bypassTenantFilter: true });

  // Update in-memory billingConfig as well for immediate sync
  if (billingConfig.PLANS && billingConfig.PLANS[cleanKey]) {
    if (fieldsToUpdate.price !== undefined) billingConfig.PLANS[cleanKey].price = fieldsToUpdate.price;
    if (fieldsToUpdate.name !== undefined) billingConfig.PLANS[cleanKey].name = fieldsToUpdate.name;
    if (fieldsToUpdate.maxAssets !== undefined) billingConfig.PLANS[cleanKey].maxAssets = fieldsToUpdate.maxAssets === -1 ? 999999999 : fieldsToUpdate.maxAssets;
  }

  return updated;
};

/**
 * Reset all plans to original defaults
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
  return await getAllPlans();
};

module.exports = {
  DEFAULT_PLANS,
  initPlanConfigs,
  getAllPlans,
  getPlanByKey,
  updatePlan,
  resetPlansToDefault
};
