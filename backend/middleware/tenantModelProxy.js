const { getTenantId } = require('./tenantContext');
const { getTenantConnection } = require('../config/tenantDb');

/**
 * Creates a Proxy wrapper around a Mongoose model.
 * Intercepts query calls and instantiation, routing them to the active tenant database.
 */
const createTenantModelProxy = (modelName, baseModel) => {
  return new Proxy(baseModel, {
    construct(target, args) {
      const tenantId = getTenantId();
      if (tenantId) {
        const tenantConn = getTenantConnection(tenantId);
        const TenantModel = tenantConn.model(modelName);
        return Reflect.construct(TenantModel, args);
      }
      return Reflect.construct(target, args);
    },
    get(target, prop, receiver) {
      // Prevent proxying Promise checks, schema metadata, and connection properties
      const bypassProps = [
        'prototype',
        'then',
        'inspect',
        'schema',
        'modelName',
        'db',
        'base',
        'discriminators'
      ];
      if (typeof prop === 'symbol' || bypassProps.includes(prop)) {
        return Reflect.get(target, prop, receiver);
      }

      const tenantId = getTenantId();
      if (tenantId) {
        try {
          const tenantConn = getTenantConnection(tenantId);
          // If the model is not registered on this connection yet, fall back to target
          if (!tenantConn.models[modelName]) {
            return Reflect.get(target, prop, receiver);
          }
          const tenantModel = tenantConn.model(modelName);
          const value = Reflect.get(tenantModel, prop);
          return typeof value === 'function' ? value.bind(tenantModel) : value;
        } catch (err) {
          console.error(`[ModelProxy] Error resolving tenant model ${modelName}:`, err.message);
        }
      }
      return Reflect.get(target, prop, receiver);
    }
  });
};

module.exports = createTenantModelProxy;
