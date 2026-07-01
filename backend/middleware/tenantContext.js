const { AsyncLocalStorage } = require('async_hooks');

const tenantContext = new AsyncLocalStorage();

module.exports = {
  tenantContext,
  getTenantId: () => {
    const store = tenantContext.getStore();
    return store ? store.tenantId : null;
  },
  setTenantId: (tenantId, callback) => {
    return tenantContext.run({ tenantId }, callback);
  }
};
