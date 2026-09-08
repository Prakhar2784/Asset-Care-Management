// Single source of truth for what each plan tier includes.
// -1 on a limit means unlimited.
const PLAN_DEFAULTS = {
  'Home User': {
    name: 'Home User',
    price: 999,
    maxAssets: 20,
    maxUsers: 1,
    maxDepartments: 1,
    features: {
      qrTagging: true,
      maintenanceTickets: true,
      serviceCenters: true,
      emailNotifications: true,
      singleDepartment: true,
      multiDepartment: false,
      approvals: false,
      warrantyRadar: false,
      slaEscalation: false,
      complianceReports: false,
      technicianServiceLogs: false,
      restApi: false,
      customBranding: false,
      auditTrail: false,
      prioritySupport: false
    },
  },
  'MSME': {
    name: 'MSME',
    price: 2999,
    maxAssets: 50,
    maxUsers: 10,
    maxDepartments: -1,
    features: {
      qrTagging: true,
      maintenanceTickets: true,
      serviceCenters: true,
      emailNotifications: true,
      singleDepartment: true,
      multiDepartment: true,
      approvals: true,
      warrantyRadar: true,
      slaEscalation: true,
      complianceReports: true,
      technicianServiceLogs: true,
      restApi: false,
      customBranding: false,
      auditTrail: true,
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
      qrTagging: true,
      maintenanceTickets: true,
      serviceCenters: true,
      emailNotifications: true,
      singleDepartment: true,
      multiDepartment: true,
      approvals: true,
      warrantyRadar: true,
      slaEscalation: true,
      complianceReports: true,
      technicianServiceLogs: true,
      restApi: true,
      customBranding: true,
      auditTrail: true,
      prioritySupport: true
    },
  },
};

const getPlanDefaults = (plan) => {
  if (!plan) return PLAN_DEFAULTS['Home User'];
  const normalized = Object.keys(PLAN_DEFAULTS).find(k => k.toLowerCase() === plan.toLowerCase());
  return normalized ? PLAN_DEFAULTS[normalized] : PLAN_DEFAULTS['Home User'];
};

module.exports = { PLAN_DEFAULTS, getPlanDefaults };

