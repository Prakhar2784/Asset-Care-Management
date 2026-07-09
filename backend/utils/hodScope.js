const User  = require('../models/User');
const Asset = require('../models/Asset');

// Fetches dept-scoped IDs for HOD users. Returns empty arrays for all other roles.
// Use only when BOTH user and asset IDs are needed — for single-axis queries,
// inline the relevant find() directly to avoid the extra round-trip.
const getHodScope = async (user) => {
  if (user.role !== 'hod' || !user.department) return { deptUserIds: [], deptAssetIds: [] };
  const [users, assets] = await Promise.all([
    User.find({ department: user.department }).select('_id'),
    Asset.find({ department: user.department, isDeleted: { $ne: true } }).select('_id'),
  ]);
  return { deptUserIds: users.map(u => u._id), deptAssetIds: assets.map(a => a._id) };
};

module.exports = { getHodScope };
