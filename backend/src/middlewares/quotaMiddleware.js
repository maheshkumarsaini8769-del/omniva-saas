const mongoose = require('mongoose');
const Tenant = require('../models/Tenant');
const Order = require('../models/Order');
const Lead = require('../models/Lead');
const { PLAN_LIMITS } = require('../config/plans');

/**
 * Enforce monthly quota based on tenant's planTier
 * @param {'orders' | 'leads' | 'staff'} resourceType
 */
const enforceQuota = (resourceType) => {
  return async (req, res, next) => {
    try {
      if (mongoose.connection.readyState !== 1) {
        return next();
      }

      let tenant = null;

      if (req.businessId) {
        tenant = await Tenant.findById(req.businessId);
      } else if (req.params.slug) {
        tenant = await Tenant.findOne({ slug: req.params.slug });
      }

      if (!tenant) {
        return next();
      }

      const planTier = tenant.planTier || 'GROWTH';
      const limits = PLAN_LIMITS[planTier] || PLAN_LIMITS.GROWTH;

      // Start of current 30-day billing window
      const periodStart = tenant.subscription?.currentPeriodStart || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      if (resourceType === 'orders') {
        const currentOrdersCount = await Order.countDocuments({
          businessId: tenant._id,
          createdAt: { $gte: periodStart },
        });

        if (currentOrdersCount >= limits.maxMonthlyOrders) {
          return res.status(403).json({
            success: false,
            code: 'QUOTA_EXCEEDED',
            message: `Monthly order limit of ${limits.maxMonthlyOrders} reached for plan tier ${planTier}. Please upgrade your Omniva subscription to accept more orders.`,
            quota: {
              resource: 'orders',
              used: currentOrdersCount,
              limit: limits.maxMonthlyOrders,
              planTier,
            },
          });
        }
      } else if (resourceType === 'leads') {
        const currentLeadsCount = await Lead.countDocuments({
          businessId: tenant._id,
          createdAt: { $gte: periodStart },
        });

        if (currentLeadsCount >= limits.maxMonthlyLeads) {
          return res.status(403).json({
            success: false,
            code: 'QUOTA_EXCEEDED',
            message: `Monthly lead limit of ${limits.maxMonthlyLeads} reached for plan tier ${planTier}. Please upgrade your subscription to capture more leads.`,
            quota: {
              resource: 'leads',
              used: currentLeadsCount,
              limit: limits.maxMonthlyLeads,
              planTier,
            },
          });
        }
      }

      // Attach tenant info to request
      req.tenantPlan = planTier;
      req.tenantLimits = limits;
      next();
    } catch (error) {
      console.warn('[Quota Middleware Warning - Bypassing]:', error.message);
      next();
    }
  };
};

module.exports = {
  enforceQuota,
};
