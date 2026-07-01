const Tenant = require('../models/Tenant');
const Asset = require('../models/Asset');
const User = require('../models/User');

const checkAssetLimit = async (req, res, next) => {
  try {
    const tenant = await Tenant.findOne({ slug: req.tenantId });
    if (!tenant) return res.status(404).json({ message: 'Tenant not found' });

    // -1 means unlimited — skip the check entirely
    if (tenant.limits.maxAssets === -1) return next();

    // Enforce limits (Note: Asset.countDocuments automatically filters by current tenant context)
    const assetCount = await Asset.countDocuments({ isDeleted: { $ne: true } });

    if (assetCount >= tenant.limits.maxAssets) {
      return res.status(403).json({ 
        message: `Plan limit reached. Your current plan allows up to ${tenant.limits.maxAssets} assets. Please upgrade your subscription.` 
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

    // -1 means unlimited — skip the check entirely
    if (tenant.limits.maxUsers === -1) return next();

    // Enforce limits (Note: User.countDocuments automatically filters by current tenant context)
    const userCount = await User.countDocuments();

    if (userCount >= tenant.limits.maxUsers) {
      return res.status(403).json({ 
        message: `Plan limit reached. Your current plan allows up to ${tenant.limits.maxUsers} users. Please upgrade your subscription.` 
      });
    }
    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { checkAssetLimit, checkUserLimit };
