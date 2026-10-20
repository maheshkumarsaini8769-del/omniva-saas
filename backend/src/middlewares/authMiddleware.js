const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Tenant = require('../models/Tenant');

// Fail fast if JWT_SECRET is missing in production
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  throw new Error('[authMiddleware] JWT_SECRET is required in production');
}

// Protect routes - JWT verification
const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token provided',
    });
  }

  try {
    const token = authHeader.slice(7);
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not configured');
    }
    const decoded = jwt.verify(token, jwtSecret);

    // Always resolve the user from the database. Never fabricate a fallback user.
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Account no longer exists. Please sign in again.',
      });
    }
    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: 'Account has been deactivated. Contact support.',
      });
    }

    req.user = user;
    if (user.businessId) {
      req.businessId = user.businessId;
    }

    return next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authorization token',
    });
  }
};

// Role-based authorization
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role (${req.user?.role || 'Guest'}) is not authorized to access this resource`,
      });
    }
    next();
  };
};

// Strict Multi-Tenant Isolation Middleware
const tenantScope = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, authentication required',
    });
  }

  // Super Admin has cross-tenant operational clearance
  if (req.user.role === 'SUPER_ADMIN') {
    return next();
  }

  if (!req.user.businessId) {
    return res.status(403).json({
      success: false,
      message: 'User does not belong to any active business tenant',
    });
  }

  // A real tenant is required. Never fabricate one.
  let tenant = null;
  try {
    tenant = await Tenant.findById(req.user.businessId);
  } catch (error) {
    tenant = null;
  }

  if (!tenant) {
    return res.status(403).json({
      success: false,
      message: 'Associated business tenant not found',
    });
  }

  if (tenant.status === 'SUSPENDED') {
    return res.status(403).json({
      success: false,
      message: 'This business account has been suspended. Please contact support.',
    });
  }

  req.tenant = tenant;
  req.businessId = tenant._id;

  // Prevent URL parameter tenant spoofing
  if (req.params.businessId && String(req.params.businessId) !== String(req.businessId)) {
    return res.status(403).json({
      success: false,
      message: 'Security Violation: Cross-tenant data access is strictly forbidden.',
    });
  }

  next();
};

module.exports = {
  protect,
  authorize,
  tenantScope,
};
