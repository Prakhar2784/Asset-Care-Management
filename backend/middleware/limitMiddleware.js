const Tenant = require('../models/Tenant');
const Asset = require('../models/Asset');
const User = require('../models/User');

const checkAssetLimit = async (req, res, next) => {
  try {
    const tenant = await Tenant.findOne({ slug: req.tenantId });
    if (!tenant) return res.status(404).json({ message: 'Tenant not found' });

    // -1 or large value means unlimited — skip the check entirely
    if (!tenant.limits || tenant.limits.maxAssets === -1 || tenant.limits.maxAssets >= 999999) {
      return next();
    }

    // Enforce limits (Note: Asset.countDocuments automatically filters by current tenant context)
    const assetCount = await Asset.countDocuments({ isDeleted: { $ne: true } });

    if (assetCount >= tenant.limits.maxAssets) {
      const upgradeMsg = tenant.plan === 'Home User'
        ? 'Your Home User plan allows up to 20 assets. Upgrade to MSME to add more assets.'
        : tenant.plan === 'MSME'
        ? 'Your MSME plan allows up to 50 assets. Upgrade to Large Scale to add more assets.'
        : `Your current plan allows up to ${tenant.limits.maxAssets} assets. Please upgrade your subscription.`;
      return res.status(403).json({ 
        message: upgradeMsg,
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
    const tenant = await Tenant.findOne({ slug: req.tenantId });
    if (!tenant) return res.status(404).json({ message: 'Tenant not found' });

    // -1 or large value means unlimited — skip the check entirely
    if (!tenant.limits || tenant.limits.maxUsers === -1 || tenant.limits.maxUsers >= 999999) {
      return next();
    }

    // Enforce limits (Note: User.countDocuments automatically filters by current tenant context)
    const userCount = await User.countDocuments();

    if (userCount >= tenant.limits.maxUsers) {
      const upgradeMsg = tenant.plan === 'Home User'
        ? 'Your Home User plan includes Single Admin management. Upgrade to MSME for multi-user access.'
        : `Plan limit reached. Your current plan allows up to ${tenant.limits.maxUsers} users. Please upgrade your subscription.`;
      return res.status(403).json({ 
        message: upgradeMsg,
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
    const tenant = await Tenant.findOne({ slug: req.tenantId });
    if (!tenant) return res.status(404).json({ message: 'Tenant not found' });

    if (tenant.plan === 'Home User') {
      const Department = require('../models/Department');
      const deptCount = await Department.countDocuments();
      if (deptCount >= 1) {
        return res.status(403).json({
          message: 'Your Home User plan includes Single Department Management. Upgrade to MSME for Multi-Department support.',
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

      const { getPlanDefaults } = require('../config/planDefaults');
      const planDefaults = getPlanDefaults(tenant.plan);
      const isAllowed = tenant.features?.[featureName] ?? planDefaults.features?.[featureName] ?? false;

      if (!isAllowed) {
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

