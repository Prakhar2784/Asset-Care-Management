const mongoose = require('mongoose');

// Cache connections
const tenantConnections = {};

/**
 * Returns a Mongoose connection scoped to a specific tenant.
 * Uses a cached connection if it exists, otherwise creates a new connection pool.
 */
const getTenantConnection = (tenantId) => {
  if (!tenantId) {
    throw new Error('Tenant ID is required to resolve database connection.');
  }

  // Use the default/control-plane connection for the 'default' tenant
  if (tenantId === 'default') {
    return mongoose.connection;
  }

  if (tenantConnections[tenantId]) {
    return tenantConnections[tenantId];
  }

  const tenantDbName = `assetcare_${tenantId}`;
  
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[Database] Scoping tenant connection to: ${tenantDbName}`);
  }

  // Use the established main connection with useDb to switch database context instantly
  const connection = mongoose.connection.useDb(tenantDbName, { useCache: true });

  // Register and compile schemas on this isolated connection instance
  if (!connection.models['User']) connection.model('User', require('../models/User').schema);
  if (!connection.models['Asset']) connection.model('Asset', require('../models/Asset').schema);
  if (!connection.models['Ticket']) connection.model('Ticket', require('../models/Ticket').schema);
  if (!connection.models['Department']) connection.model('Department', require('../models/Department').schema);
  if (!connection.models['AssetAssignment']) connection.model('AssetAssignment', require('../models/AssetAssignment').schema);
  if (!connection.models['Notification']) connection.model('Notification', require('../models/Notification').schema);
  if (!connection.models['AuditLog']) connection.model('AuditLog', require('../models/AuditLog').schema);
  if (!connection.models['MaintenanceLog']) connection.model('MaintenanceLog', require('../models/MaintenanceLog').schema);
  
  // Version 1.5 Enterprise models
  if (!connection.models['SoftwareLicense']) connection.model('SoftwareLicense', require('../models/SoftwareLicense').schema);
  if (!connection.models['AMCContract']) connection.model('AMCContract', require('../models/AMCContract').schema);
  if (!connection.models['WarrantyClaim']) connection.model('WarrantyClaim', require('../models/WarrantyClaim').schema);
  if (!connection.models['MaintenanceSchedule']) connection.model('MaintenanceSchedule', require('../models/MaintenanceSchedule').schema);
  if (!connection.models['TransferRequest']) connection.model('TransferRequest', require('../models/TransferRequest').schema);
  
  // CMDB Custom Fields model
  if (!connection.models['CustomField']) connection.model('CustomField', require('../models/CustomField').schema);

  if (!connection.models['ServiceCenter']) connection.model('ServiceCenter', require('../models/ServiceCenter').schema);

  tenantConnections[tenantId] = connection;
  return connection;
};

const getTenantModel = (tenantId, modelName) => {
  const conn = getTenantConnection(tenantId);
  return conn.model(modelName);
};

module.exports = { getTenantConnection, getTenantModel };
