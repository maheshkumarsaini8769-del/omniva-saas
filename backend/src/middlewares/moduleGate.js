// backend/src/middlewares/moduleGate.js
// Enforces server-side module entitlements on a per-tenant basis.
// Fails CLOSED: an unknown or missing entitlement denies access.

const moduleGate = (requiredModule) => {
  return (req, res, next) => {
    // Super Admin has operational clearance across all modules
    if (req.user && req.user.role === 'SUPER_ADMIN') {
      return next();
    }

    // Tenant info must be attached by auth/tenantScope middleware
    const tenant = req.tenant;
    if (!tenant) {
      return res.status(403).json({
        success: false,
        code: 'TENANT_CONTEXT_MISSING',
        message: 'No tenant context found for this request',
      });
    }

    const rawModules = tenant.enabledModules;
    const enabledModules =
      rawModules && typeof rawModules.toObject === 'function'
        ? rawModules.toObject()
        : rawModules;

    if (!enabledModules || typeof enabledModules !== 'object') {
      return res.status(403).json({
        success: false,
        code: 'MODULE_MAP_MISSING',
        module: requiredModule,
        message: 'No module entitlements are configured for this business. Contact platform administration.',
      });
    }

    let isAllowed = false;
    if (requiredModule in enabledModules) {
      isAllowed = Boolean(enabledModules[requiredModule]);
    } else if (requiredModule === 'orders' || requiredModule === 'inventory') {
      // Alias: inventory & orders belong to the products module
      isAllowed = Boolean(enabledModules.products);
    }
    // Anything not explicitly granted is denied.

    if (!isAllowed) {
      return res.status(403).json({
        success: false,
        code: 'MODULE_DISABLED_BY_ADMIN',
        module: requiredModule,
        message: `The '${requiredModule}' module is disabled for your business account by platform administration. Contact Super Admin to enable access.`,
      });
    }

    next();
  };
};

module.exports = moduleGate;
