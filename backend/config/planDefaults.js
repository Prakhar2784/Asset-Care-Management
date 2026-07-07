// Single source of truth for what each plan tier includes.
// -1 on a limit means unlimited.
const PLAN_DEFAULTS = {
  Basic: {
    maxAssets: 50,
    maxUsers: 10,
    features: {
      procurement: false,
      enterpriseHub: false,
      customBranding: false,
      advancedReports: false,
    },
  },
  Pro: {
    maxAssets: 500,
    maxUsers: 50,
    features: {
      procurement: true,
      enterpriseHub: true,
      customBranding: false,
      advancedReports: true,
    },
  },
  Enterprise: {
    maxAssets: -1,
    maxUsers: -1,
    features: {
      procurement: true,
      enterpriseHub: true,
      customBranding: true,
      advancedReports: true,
    },
  },
};

const getPlanDefaults = (plan) => PLAN_DEFAULTS[plan] || PLAN_DEFAULTS.Basic;

module.exports = { PLAN_DEFAULTS, getPlanDefaults };
