const Tenant = require('../models/Tenant');
const Order = require('../models/Order');
const Lead = require('../models/Lead');
const User = require('../models/User');
const { PLAN_LIMITS } = require('../config/plans');

// @desc    Get all available platform plans
// @route   GET /api/subscriptions/plans
// @access  Public
const getPlans = async (req, res) => {
  try {
    res.json({ success: true, data: Object.values(PLAN_LIMITS) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get tenant subscription status and live quota usage
// @route   GET /api/subscriptions/usage
// @access  Private (Merchant Admin/Staff)
const getSubscriptionUsage = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.businessId);
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }

    const planTier = tenant.planTier || 'GROWTH';
    const limits = PLAN_LIMITS[planTier] || PLAN_LIMITS.GROWTH;
    const periodStart = tenant.subscription?.currentPeriodStart || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [ordersUsed, leadsUsed, staffUsed] = await Promise.all([
      Order.countDocuments({ businessId: tenant._id, createdAt: { $gte: periodStart } }),
      Lead.countDocuments({ businessId: tenant._id, createdAt: { $gte: periodStart } }),
      User.countDocuments({ businessId: tenant._id }),
    ]);

    res.json({
      success: true,
      data: {
        planTier,
        status: tenant.subscription?.status || 'ACTIVE',
        billingCycle: tenant.subscription?.billingCycle || 'MONTHLY',
        currentPeriodStart: tenant.subscription?.currentPeriodStart,
        currentPeriodEnd: tenant.subscription?.currentPeriodEnd,
        limits,
        usage: {
          orders: {
            used: ordersUsed,
            limit: limits.maxMonthlyOrders,
            percentage: Math.min(100, Math.round((ordersUsed / limits.maxMonthlyOrders) * 100)),
          },
          leads: {
            used: leadsUsed,
            limit: limits.maxMonthlyLeads,
            percentage: Math.min(100, Math.round((leadsUsed / limits.maxMonthlyLeads) * 100)),
          },
          staff: {
            used: staffUsed,
            limit: limits.maxStaffSeats,
            percentage: Math.min(100, Math.round((staffUsed / limits.maxStaffSeats) * 100)),
          },
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Upgrade or switch subscription plan
// @route   POST /api/subscriptions/upgrade
// @access  Private (Merchant Owner / Admin)
const upgradePlan = async (req, res) => {
  try {
    // Defense in depth: even if the route authorization changes, a merchant
    // cannot grant itself a paid plan before billing is integrated.
    if (req.user && req.user.role === 'MERCHANT_OWNER') {
      return res.status(403).json({
        success: false,
        message: 'Plan changes require platform admin approval. Contact support to upgrade your subscription.',
      });
    }

    const { planTier, billingCycle = 'MONTHLY' } = req.body;

    if (!planTier || !PLAN_LIMITS[planTier]) {
      return res.status(400).json({
        success: false,
        message: 'Invalid plan tier. Available: STARTER, GROWTH, PRO',
      });
    }
    if (!['MONTHLY', 'ANNUAL'].includes(billingCycle)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid billing cycle. Available: MONTHLY, ANNUAL',
      });
    }

    const tenant = await Tenant.findById(req.businessId);
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }

    // Preserve the current usage window. Changing plans must not reset the
    // monthly quota counters or let a merchant escape an exhausted limit.
    const existingStart = tenant.subscription?.currentPeriodStart || new Date();
    const periodDays = billingCycle === 'ANNUAL' ? 365 : 30;

    tenant.planTier = planTier;
    tenant.subscription = {
      status: 'ACTIVE',
      billingCycle,
      currentPeriodStart: existingStart,
      currentPeriodEnd: new Date(
        Math.max(
          existingStart.getTime(),
          Date.now()
        ) + periodDays * 24 * 60 * 60 * 1000
      ),
    };

    await tenant.save();

    res.json({
      success: true,
      message: `Successfully upgraded to ${PLAN_LIMITS[planTier].name}`,
      data: {
        planTier: tenant.planTier,
        subscription: tenant.subscription,
        limits: PLAN_LIMITS[planTier],
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get detailed financial and profit margin analytics
// @route   GET /api/subscriptions/analytics
// @access  Private (Merchant Owner / Admin)
const getFinancialAnalytics = async (req, res) => {
  try {
    const orders = await Order.find({ businessId: req.businessId });

    const totalOrdersCount = orders.length;
    let grossSales = 0;
    let netSales = 0;
    let codSales = 0;
    let onlineSales = 0;
    let codOrdersCount = 0;
    let onlineOrdersCount = 0;
    let cancelledOrdersCount = 0;

    for (const order of orders) {
      grossSales += order.totalAmount || 0;

      if (order.orderStatus === 'CANCELLED') {
        cancelledOrdersCount++;
      } else {
        netSales += order.totalAmount || 0;
      }

      if (order.paymentMethod === 'COD') {
        codSales += order.totalAmount || 0;
        codOrdersCount++;
      } else {
        onlineSales += order.totalAmount || 0;
        onlineOrdersCount++;
      }
    }

    const aov = totalOrdersCount > 0 ? Math.round(grossSales / totalOrdersCount) : 0;
    const cancellationRate = totalOrdersCount > 0 ? ((cancelledOrdersCount / totalOrdersCount) * 100).toFixed(1) : 0;

    res.json({
      success: true,
      data: {
        totalOrdersCount,
        grossSales,
        netSales,
        codSales,
        onlineSales,
        codOrdersCount,
        onlineOrdersCount,
        cancelledOrdersCount,
        cancellationRate: Number(cancellationRate),
        aov,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getPlans,
  getSubscriptionUsage,
  upgradePlan,
  getFinancialAnalytics,
};
