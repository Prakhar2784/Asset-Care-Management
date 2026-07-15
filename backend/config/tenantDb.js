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

  const baseUri = process.env.MONGO_URI.split('?')[0];
  const options = process.env.MONGO_URI.split('?')[1] || '';
  const tenantDbName = `assetcare_${tenantId}`;
  
  // Replace the default database name (last segment) with tenant database name
  const lastSlashIndex = baseUri.lastIndexOf('/');
  const baseUriWithoutDb = baseUri.substring(0, lastSlashIndex);
  const tenantUri = `${baseUriWithoutDb}/${tenantDbName}?${options}`;

  console.log(`[Database] Instantiating isolated connection to: ${tenantDbName}`);

  const connection = mongoose.createConnection(tenantUri, {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
  });

  // Register and compile schemas on this isolated connection instance
  connection.model('User', require('../models/User').schema);
  connection.model('Asset', require('../models/Asset').schema);
  connection.model('Ticket', require('../models/Ticket').schema);
  connection.model('Department', require('../models/Department').schema);
  connection.model('DeviceRequest', require('../models/DeviceRequest').schema);
  connection.model('AssetAssignment', require('../models/AssetAssignment').schema);
  connection.model('Notification', require('../models/Notification').schema);
  connection.model('AuditLog', require('../models/AuditLog').schema);
  connection.model('MaintenanceLog', require('../models/MaintenanceLog').schema);
  
  // Version 1.5 Enterprise models
  connection.model('SoftwareLicense', require('../models/SoftwareLicense').schema);
  connection.model('AMCContract', require('../models/AMCContract').schema);
  connection.model('WarrantyClaim', require('../models/WarrantyClaim').schema);
  connection.model('MaintenanceSchedule', require('../models/MaintenanceSchedule').schema);
  connection.model('TransferRequest', require('../models/TransferRequest').schema);
  
  connection.model('ApprovalTracking', require('../models/ApprovalTracking').schema);

  // CMDB Custom Fields model
  connection.model('CustomField', require('../models/CustomField').schema);

  connection.model('ServiceCenter', require('../models/ServiceCenter').schema);

  tenantConnections[tenantId] = connection;
  return connection;
};

module.exports = { getTenantConnection };
