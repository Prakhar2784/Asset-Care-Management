const Tenant = require('../models/Tenant');
const Asset = require('../models/Asset');
const User = require('../models/User');
const { getPlanByKey } = require('../services/planService');
const { getPlanDefaults } = require('../config/planDefaults');

const checkAssetLimit = async (req, res, next) => {
  try {
    const tenant = await Tenant.findOne({ slug: req.tenantId });
    if (!tenant) return res.status(404).json({ message: 'Tenant not found' });

    let maxAssets = tenant.limits?.maxAssets;
    if (maxAssets === undefined || maxAssets === null) {
      const livePlan = await getPlanByKey(tenant.plan);
      maxAssets = livePlan?.maxAssets ?? getPlanDefaults(tenant.plan).maxAssets;
    }

    // -1 or large value means unlimited — skip the check entirely
    if (maxAssets === -1 || maxAssets >= 999999) {
      return next();
    }

    // Enforce limits with accurate tenant scoping
    const AssetModel = (req.db && req.db.models && req.db.models['Asset']) ? req.db.models['Asset'] : Asset;
    const assetsInTenant = await AssetModel.find({ tenantId: req.tenantId, isDeleted: { $ne: true } }).setOptions({ bypassTenantFilter: true }).lean();
    const assetCount = assetsInTenant.length;

    if (assetCount >= maxAssets) {
      return res.status(403).json({ 
        message: `Your current plan allows up to ${maxAssets} assets. Please upgrade your plan or request additional capacity.`,
        code: 'PLAN_LIMIT_REACHED'
      });
    }
    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const checkUserLimit = async (req, res, next) => {
  try {
    const tenant = await Tenant.findOne({ slug: req.tenantId }).setOptions({ bypassTenantFilter: true });
    if (!tenant) return res.status(404).json({ message: 'Tenant not found' });

    let maxUsers = tenant.limits?.maxUsers;
    if (maxUsers === undefined || maxUsers === null) {
      const livePlan = await getPlanByKey(tenant.plan);
      maxUsers = livePlan?.maxUsers ?? getPlanDefaults(tenant.plan).maxUsers;
    }

    // -1 or large value means unlimited — skip the check entirely
    if (maxUsers === -1 || maxUsers >= 999999) {
      return next();
    }

    const UserModel = (req.db && req.db.models && req.db.models['User']) ? req.db.models['User'] : User;
    const usersInTenant = await UserModel.find({ tenantId: req.tenantId }).setOptions({ bypassTenantFilter: true }).lean();
    const userCount = usersInTenant.length;

    if (userCount >= maxUsers) {
      return res.status(403).json({ 
        message: `Your current plan allows up to ${maxUsers} user accounts. Please upgrade your plan or request additional capacity.`,
        code: 'PLAN_LIMIT_REACHED'
      });
    }
    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const checkDepartmentLimit = async (req, res, next) => {
  try {
    const tenant = await Tenant.findOne({ slug: req.tenantId }).setOptions({ bypassTenantFilter: true });
    if (!tenant) return res.status(404).json({ message: 'Tenant not found' });

    let maxDepts = tenant.limits?.maxDepartments;
    if (maxDepts === undefined || maxDepts === null) {
      const livePlan = await getPlanByKey(tenant.plan);
      maxDepts = livePlan?.maxDepartments ?? getPlanDefaults(tenant.plan).maxDepartments ?? 2;
    }

    if (maxDepts !== -1 && maxDepts < 999999) {
      const Department = require('../models/Department');
      const DeptModel = (req.db && req.db.models && req.db.models['Department']) ? req.db.models['Department'] : Department;
      const deptsInTenant = await DeptModel.find({ tenantId: req.tenantId }).setOptions({ bypassTenantFilter: true }).lean();
      const deptCount = deptsInTenant.length;
      if (deptCount >= maxDepts) {
        return res.status(403).json({
          message: `Your current plan allows up to ${maxDepts} departments. Please upgrade your plan or request additional capacity.`,
          code: 'PLAN_LIMIT_REACHED'
        });
      }
    }
    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const checkFeatureAccess = (featureName, upgradeMsg) => {
  return async (req, res, next) => {
    try {
      const tenant = await Tenant.findOne({ slug: req.tenantId });
      if (!tenant) return res.status(404).json({ message: 'Tenant not found' });

      let isAllowed = false;
      if (tenant.features && tenant.features[featureName] !== undefined) {
        isAllowed = tenant.features[featureName];
      } else {
        const livePlan = await getPlanByKey(tenant.plan);
        if (livePlan && livePlan.featureFlags && livePlan.featureFlags[featureName] !== undefined) {
          isAllowed = livePlan.featureFlags[featureName];
        } else {
          const planDefaults = getPlanDefaults(tenant.plan);
          isAllowed = planDefaults.features?.[featureName] ?? false;
        }
      }

      const isPermitted = featureName === 'ticketing'
        ? (isAllowed && isAllowed !== 'none' && isAllowed !== false)
        : Boolean(isAllowed);

      if (!isPermitted) {
        return res.status(403).json({
          message: upgradeMsg || `This feature is not included in your current plan (${tenant.plan || 'Home User'}). Please upgrade to access it.`,
          code: 'FEATURE_NOT_ENTITLED'
        });
      }
      next();
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
};

module.exports = { checkAssetLimit, checkUserLimit, checkDepartmentLimit, checkFeatureAccess };

