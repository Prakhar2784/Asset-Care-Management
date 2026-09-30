// Single source of truth for what each plan tier includes.
// -1 on a limit means unlimited.
const PLAN_DEFAULTS = {
  'Home User': {
    name: 'Home User',
    price: 999,
    maxAssets: 20,
    maxUsers: 3,
    maxDepartments: 2,
    features: {
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
      // legacy compat
      qrTagging: true,
      maintenanceTickets: true,
      serviceCenters: true,
      emailNotifications: true,
      singleDepartment: false,
      multiDepartment: true,
      approvals: false,
      warrantyRadar: false,
      complianceReports: false,
      technicianServiceLogs: false,
      restApi: false,
      prioritySupport: false
    },
  },
  'MSME': {
    name: 'MSME',
    price: 2999,
    maxAssets: 50,
    maxUsers: 15,
    maxDepartments: 5,
    features: {
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
      // legacy compat
      qrTagging: true,
      maintenanceTickets: true,
      serviceCenters: true,
      emailNotifications: true,
      singleDepartment: true,
      multiDepartment: true,
      approvals: true,
      warrantyRadar: true,
      complianceReports: true,
      technicianServiceLogs: true,
      restApi: false,
      prioritySupport: false
    },
  },
  'Large Scale': {
    name: 'Large Scale',
    price: 8999,
    maxAssets: -1,
    maxUsers: -1,
    maxDepartments: -1,
    features: {
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
      // legacy compat
      qrTagging: true,
      maintenanceTickets: true,
      serviceCenters: true,
      emailNotifications: true,
      singleDepartment: true,
      multiDepartment: true,
      approvals: true,
      warrantyRadar: true,
      complianceReports: true,
      technicianServiceLogs: true,
      restApi: true,
      prioritySupport: true
    },
  },
  'Custom Plan': {
    name: 'Custom Plan',
    price: 4999,
    maxAssets: 100,
    maxUsers: 25,
    maxDepartments: 10,
    features: {
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
      // legacy compat
      qrTagging: true,
      maintenanceTickets: true,
      serviceCenters: true,
      emailNotifications: true,
      singleDepartment: true,
      multiDepartment: true,
      approvals: true,
      warrantyRadar: true,
      complianceReports: true,
      technicianServiceLogs: true,
      restApi: true,
      prioritySupport: true
    },
  }
};

const getPlanDefaults = (plan) => {
  if (!plan) return PLAN_DEFAULTS['Home User'];
  const cleanPlan = plan.toString().replace(/\s*\(\+?\d+.*?\)\s*/g, '').trim();
  const normalized = Object.keys(PLAN_DEFAULTS).find(k => k.toLowerCase() === cleanPlan.toLowerCase() || k.toLowerCase() === plan.toString().toLowerCase());
  return normalized ? PLAN_DEFAULTS[normalized] : PLAN_DEFAULTS['Home User'];
};

module.exports = { PLAN_DEFAULTS, getPlanDefaults };

