const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const Tenant = require('../models/Tenant');

// Protect routes - JWT verification
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'omniva_default_secret_key_change_in_prod'
      );

      let user = null;
      if (mongoose.connection.readyState === 1) {
        user = await User.findById(decoded.id).select('-password');
      }

      if (!user) {
        // Fallback for cloud demo mode when DB is disconnected
        user = {
          _id: decoded.id || '6acf096038d323550330be65',
          id: decoded.id || '6acf096038d323550330be65',
          name: decoded.role === 'SUPER_ADMIN' ? 'Mahesh (Super Admin)' : 'Rahul Sharma',
          email: decoded.role === 'SUPER_ADMIN' ? 'superadmin@omniva.io' : 'rahul@desirasoi.com',
          role: decoded.role || 'MERCHANT_OWNER',
          businessId: decoded.businessId || '6acf096038d323550330be64',
          isActive: true
        };
      }

      req.user = user;

      // If user belongs to a business, attach tenant info
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
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token provided',
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
// Ensures non-SuperAdmin cannot query or alter any other tenant's data
const tenantScope = async (req, res, next) => {
  if (req.user.role === 'SUPER_ADMIN') {
    // Super Admin has cross-tenant operational clearance
    return next();
  }

  if (!req.user.businessId) {
    return res.status(403).json({
      success: false,
      message: 'User does not belong to any active business tenant',
    });
  }

  // Verify the tenant itself is active
  let tenant = null;
  if (mongoose.connection.readyState === 1) {
    try {
      tenant = await Tenant.findById(req.user.businessId);
    } catch (e) {
      tenant = null;
    }
  }

  if (!tenant) {
    // Cloud demo mode fallback when DB is disconnected
    tenant = {
      _id: req.user.businessId || '6acf096038d323550330be64',
      businessName: 'Desi Rasoi Achar',
      slug: 'desi-rasoi-achar-1',
      businessType: 'PRODUCT',
      status: 'ACTIVE',
      planTier: 'GROWTH',
      enabledModules: {
        automations: true,
        crmLeads: true,
        marketingAds: true,
        products: true,
        serviceBookings: false,
        travelBookings: false,
        inventory: true,
        orders: true,
      },
    };
  }

  if (tenant.status === 'SUSPENDED') {
    return res.status(403).json({
      success: false,
      message: 'This business account has been suspended. Please contact support.',
    });
  }

  req.tenant = tenant;
  req.businessId = tenant._id;

  // Prevent URL parameter tenant spoofing:
  // e.g. if request is /api/orders/:businessId, it MUST match req.businessId
  if (req.params.businessId && req.params.businessId !== req.businessId.toString()) {
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
