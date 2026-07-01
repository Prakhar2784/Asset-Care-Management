const { getTenantId } = require('./tenantContext');

module.exports = function tenantPlugin(schema) {
  // If the schema does not have a tenantId field (e.g. the Tenant model), skip filtering
  if (!schema.paths.tenantId) {
    return;
  }

  // Pre-save hook: ensure new documents get the tenantId from context if not set
  schema.pre('save', function () {
    const tenantId = getTenantId();
    // Set tenantId if present in context and not explicitly specified in doc
    if (tenantId && (this.tenantId === 'default' || !this.tenantId)) {
      this.tenantId = tenantId;
    }
  });

  // Query hooks to filter by active tenantId
  const queryHooks = [
    'find',
    'findOne',
    'countDocuments',
    'updateOne',
    'updateMany',
    'deleteOne',
    'deleteMany',
    'findOneAndUpdate',
    'findOneAndDelete',
    'findOneAndReplace',
    'replaceOne'
  ];

  const applyTenantFilter = function () {
    const tenantId = getTenantId();
    // Only filter by tenantId if a tenant context exists AND bypass option is not set
    if (tenantId && !this.getOptions().bypassTenantFilter) {
      // Apply the tenantId filter to the query conditions
      this.where({ tenantId });
    }
  };

  queryHooks.forEach((hook) => {
    schema.pre(hook, applyTenantFilter);
  });
};
