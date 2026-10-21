const mongoose = require('mongoose');
const { getPrimaryImageUrl } = require('../utils/productImages');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const { triggerAutomation } = require('../services/automationEngine');
const { buildAppUrl } = require('../utils/appUrl');

const ORDER_STATUSES = ['NEW', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
const PAYMENT_STATUSES = ['PENDING', 'PAID', 'FAILED', 'REFUNDED'];
const OWNER_ROLES = ['SUPER_ADMIN', 'SUPER_STAFF', 'MERCHANT_OWNER'];

const hasStaffPermission = (user, permission) =>
  Array.isArray(user?.customPermissions) && user.customPermissions.includes(permission);

const assertOrderUpdateAllowed = (user, { orderStatus, paymentStatus, duplicateResolved }) => {
  if (!user || OWNER_ROLES.includes(user.role)) return null;

  if (paymentStatus !== undefined) {
    return 'Only the business owner can change payment status';
  }
  if (duplicateResolved !== undefined) {
    return 'Only the business owner can resolve duplicate-order flags';
  }

  if (!orderStatus) return null;

  if (user.role === 'ORDER_MANAGER') {
    if (['CONFIRMED', 'PROCESSING'].includes(orderStatus)) return null;
    if (orderStatus === 'CANCELLED' && hasStaffPermission(user, 'orders:cancel')) return null;
    return 'Order managers can confirm or process orders. Cancellation requires explicit permission.';
  }

  if (user.role === 'INVENTORY_STAFF') {
    if (['SHIPPED', 'DELIVERED'].includes(orderStatus)) return null;
    if (orderStatus === 'CANCELLED' && hasStaffPermission(user, 'orders:cancel')) return null;
    return 'Inventory staff can only mark orders shipped or delivered. Cancellation requires explicit permission.';
  }

  return 'This staff role is not allowed to update orders';
};

// @desc    Get all orders for merchant with optional status & date filtering
// @route   GET /api/orders
// @access  Private (Merchant Admin/Staff)
const getOrders = async (req, res) => {
  try {
    const { orderStatus, paymentStatus, search, startDate, endDate, page = 1, limit = 100 } = req.query;

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Order data is temporarily unavailable. Please try again shortly.',
      });
    }

    const filter = { businessId: req.businessId };
    if (!req.query.includeTest) {
      filter.orderNumber = { $not: /^DUMMY/ };
    }

    if (orderStatus && orderStatus !== 'ALL') filter.orderStatus = orderStatus;
    if (paymentStatus && paymentStatus !== 'ALL') filter.paymentStatus = paymentStatus;
    if (search) {
      const safeSearch = String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { orderNumber: { $regex: safeSearch, $options: 'i' } },
        { customerName: { $regex: safeSearch, $options: 'i' } },
        { customerPhone: { $regex: safeSearch, $options: 'i' } },
      ];
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const total = await Order.countDocuments(filter);
    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10));

    // If the database has no orders for this tenant, return an empty list.
    // Never substitute demo or another tenant's orders.

    res.json({
      success: true,
      count: orders.length,
      total,
      currentPage: parseInt(page, 10),
      totalPages: Math.ceil(total / parseInt(limit, 10)) || 1,
      data: orders,
    });
  } catch (error) {
    console.error('[getOrders]', error.message);
    return res.status(500).json({
      success: false,
      message: 'Could not load orders. No fallback data was substituted.',
    });
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private (Merchant Admin/Staff)
const getOrderById = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Order data is temporarily unavailable. Please try again shortly.',
      });
    }

    const identifier = String(req.params.id || '').trim();
    if (!identifier) {
      return res.status(400).json({ success: false, message: 'An order id or order number is required' });
    }

    const lookup = mongoose.isValidObjectId(identifier)
      ? { $or: [{ _id: identifier }, { orderNumber: identifier }] }
      : { orderNumber: identifier };
    const order = await Order.findOne({ ...lookup, businessId: req.businessId });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    return res.json({ success: true, data: order });
  } catch (error) {
    console.error('[getOrderById]', error.message);
    return res.status(500).json({
      success: false,
      message: 'Could not load the order. No fallback data was substituted.',
    });
  }
};

// @desc    Update order status, tracking, or payment
// @route   PATCH /api/orders/:id/status
// @access  Private (Merchant Admin/Staff)
const updateOrderStatus = async (req, res) => {
  try {
    const { orderStatus, paymentStatus, courierPartner, trackingNumber, note, duplicateResolved } = req.body;
    const updater = req.user ? `${req.user.name} (${req.user.role})` : 'Merchant Admin';

    if (orderStatus && !ORDER_STATUSES.includes(orderStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid order status' });
    }
    if (paymentStatus && !PAYMENT_STATUSES.includes(paymentStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid payment status' });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Order updates are temporarily unavailable. No change was saved.',
      });
    }

    const order = await Order.findOne({ _id: req.params.id, businessId: req.businessId });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const permissionError = assertOrderUpdateAllowed(req.user, {
      orderStatus,
      paymentStatus,
      duplicateResolved,
    });
    if (permissionError) {
      return res.status(403).json({ success: false, message: permissionError });
    }

    const previousStatus = order.orderStatus;

    if (previousStatus === 'CANCELLED' && orderStatus && orderStatus !== 'CANCELLED') {
      return res.status(409).json({
        success: false,
        message: 'A cancelled order cannot be reopened. Create a new order instead.',
      });
    }
    if (previousStatus === 'CANCELLED' && orderStatus === 'CANCELLED') {
      return res.status(409).json({
        success: false,
        message: 'This order is already cancelled. No stock or coupon change was made.',
      });
    }

    if (duplicateResolved !== undefined) {
      order.duplicateResolved = Boolean(duplicateResolved);
    }

    if (orderStatus && orderStatus !== order.orderStatus) {
      // Claim the cancellation atomically. Two concurrent cancellation requests
      // must not both restore the same stock.
      if (orderStatus === 'CANCELLED' && order.orderStatus !== 'CANCELLED') {
        const claim = await Order.findOneAndUpdate(
          {
            _id: order._id,
            businessId: order.businessId,
            orderStatus: { $ne: 'CANCELLED' },
            stockRestored: { $ne: true },
          },
          { $set: { stockRestored: true } },
          { new: true }
        );
        if (!claim) {
          return res.status(409).json({
            success: false,
            message: 'This order is already being cancelled or was cancelled already',
          });
        }
        order.stockRestored = true;

        // Restore stock only for orders that actually decremented inventory
        // when they were created. Legacy or manual orders may not have taken it.
        if (order.stockDecremented && order.items && order.items.length) {
          for (const item of order.items) {
            if (!item.productId) continue;
            try {
              if (!mongoose.Types.ObjectId.isValid(item.productId)) continue;
              // Only restore stock when the product actually tracks quantity.
              const prod = await Product.findById(item.productId).select('trackQuantity');
              if (!prod || prod.trackQuantity === false) continue;
              if (item.variantId && mongoose.Types.ObjectId.isValid(item.variantId)) {
                await Product.updateOne(
                  { _id: item.productId, 'variants._id': item.variantId },
                  { $inc: { 'variants.$.stockQuantity': item.quantity } }
                );
              } else if (item.productId && mongoose.Types.ObjectId.isValid(item.productId)) {
                await Product.updateOne(
                  { _id: item.productId },
                  { $inc: { stockQuantity: item.quantity } }
                );
              }
            } catch (stockErr) {
              console.warn('[Order Cancel Stock Restoration Warning]:', stockErr.message);
            }
          }
        }

        // Return the coupon use claimed at checkout. Legacy orders have no
        // couponUsageRestored flag, so couponCode is the source of truth.
        if (order.couponCode && !order.couponUsageRestored) {
          try {
            await Coupon.updateOne(
              {
                businessId: order.businessId,
                code: order.couponCode,
                usageCount: { $gt: 0 },
              },
              { $inc: { usageCount: -1 } }
            );
            order.couponUsageRestored = true;
          } catch (couponErr) {
            console.warn('[Order Cancel Coupon Restoration Warning]:', couponErr.message);
          }
        }
      }

      order.orderStatus = orderStatus;
      order.timeline.push({
        status: orderStatus,
        note: note || `Status updated to ${orderStatus}`,
        updatedBy: updater,
        timestamp: new Date(),
      });
    }

    if (paymentStatus) {
      order.paymentStatus = paymentStatus;
    }
    if (courierPartner !== undefined) order.courierPartner = courierPartner;
    if (trackingNumber !== undefined) order.trackingNumber = trackingNumber;
    if (note && !orderStatus) {
      order.timeline.push({
        status: order.orderStatus,
        note,
        updatedBy: updater,
        timestamp: new Date(),
      });
    }

    await order.save();

    // Trigger automations for status transition
    if (orderStatus && orderStatus !== previousStatus) {
      const trackingUrl = buildAppUrl(
        req,
        `/orders/track?${new URLSearchParams({
          orderNumber: order.orderNumber || '',
          phone: order.customerPhone || '',
          ...(req.tenant?.slug ? { slug: req.tenant.slug } : {}),
        }).toString()}`
      );
      const payloadData = {
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        totalAmount: order.totalAmount,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        courierName: order.courierPartner || courierPartner || 'Courier not specified',
        trackingNumber: order.trackingNumber || trackingNumber || 'Not available',
        trackingUrl,
        feedbackUrl: req.tenant?.slug
          ? buildAppUrl(req, `/store/${req.tenant.slug}`)
          : '',
        refundInfo:
          order.paymentMethod === 'COD'
            ? 'No payment was collected, so there is nothing to refund.'
            : 'Any paid amount is refunded to the original payment method.',
      };

      if (orderStatus === 'CONFIRMED') {
        triggerAutomation({
          businessId: req.businessId,
          trigger: 'ORDER_CONFIRMED',
          entityType: 'ORDER',
          entityId: order._id.toString(),
          data: payloadData,
        }).catch((err) => console.error('[Automation ORDER_CONFIRMED Trigger Error]:', err.message));
      } else if (orderStatus === 'SHIPPED') {
        triggerAutomation({
          businessId: req.businessId,
          trigger: 'ORDER_SHIPPED',
          entityType: 'ORDER',
          entityId: order._id.toString(),
          data: payloadData,
        }).catch((err) => console.error('[Automation ORDER_SHIPPED Trigger Error]:', err.message));
      } else if (orderStatus === 'DELIVERED') {
        triggerAutomation({
          businessId: req.businessId,
          trigger: 'ORDER_DELIVERED',
          entityType: 'ORDER',
          entityId: order._id.toString(),
          data: payloadData,
        }).catch((err) => console.error('[Automation ORDER_DELIVERED Trigger Error]:', err.message));
      } else if (orderStatus === 'CANCELLED') {
        triggerAutomation({
          businessId: req.businessId,
          trigger: 'ORDER_CANCELLED',
          entityType: 'ORDER',
          entityId: order._id.toString(),
          data: payloadData,
        }).catch((err) => console.error('[Automation ORDER_CANCELLED Trigger Error]:', err.message));
      }
    }

    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get order metrics and summary stats with optional date range filter
// @route   GET /api/orders/stats
// @access  Private (Merchant Admin/Staff)
const getOrderStats = async (req, res) => {
  try {
    const businessId = req.businessId;
    const { startDate, endDate } = req.query;

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Order statistics are temporarily unavailable. Please try again shortly.',
      });
    }

    const matchFilter = { businessId };
    if (startDate || endDate) {
      matchFilter.createdAt = {};
      if (startDate) matchFilter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        matchFilter.createdAt.$lte = end;
      }
    }

    const [totalOrders, statusCounts, revenueStats] = await Promise.all([
      Order.countDocuments(matchFilter),
      Order.aggregate([
        { $match: matchFilter },
        { $group: { _id: '$orderStatus', count: { $sum: 1 } } },
      ]),
      Order.aggregate([
        { $match: { ...matchFilter, orderStatus: { $ne: 'CANCELLED' } } },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$totalAmount' },
            codRevenue: {
              $sum: { $cond: [{ $eq: ['$paymentMethod', 'COD'] }, '$totalAmount', 0] },
            },
            onlineRevenue: {
              $sum: { $cond: [{ $eq: ['$paymentMethod', 'ONLINE'] }, '$totalAmount', 0] },
            },
            paidRevenue: {
              $sum: { $cond: [{ $eq: ['$paymentStatus', 'PAID'] }, '$totalAmount', 0] },
            },
          },
        },
      ]),
    ]);

    const statusMap = {
      NEW: 0,
      CONFIRMED: 0,
      PROCESSING: 0,
      SHIPPED: 0,
      DELIVERED: 0,
      CANCELLED: 0,
    };
    statusCounts.forEach((s) => {
      if (statusMap[s._id] !== undefined) statusMap[s._id] = s.count;
    });

    const revenue = revenueStats[0] || {
      totalRevenue: 0,
      codRevenue: 0,
      onlineRevenue: 0,
      paidRevenue: 0,
    };

    res.json({
      success: true,
      data: {
        totalOrders,
        statusCounts: statusMap,
        revenue,
        filterApplied: { startDate: startDate || null, endDate: endDate || null },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get AI Business Insights and Growth Analysis
// @route   GET /api/orders/ai-insights
// @access  Private (Merchant Admin/Staff)
const getAiOrderInsights = async (req, res) => {
  try {
    const businessId = req.businessId;
    const { startDate, endDate } = req.query;

    const currentFilter = { businessId };
    let comparisonFilter = { businessId };

    const now = new Date();
    const start = startDate ? new Date(startDate) : new Date(now.getFullYear(), now.getMonth(), 1);
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    currentFilter.createdAt = { $gte: start, $lte: end };

    // Calculate duration for comparison window
    const durationMs = end.getTime() - start.getTime();
    const compEnd = new Date(start.getTime() - 1);
    const compStart = new Date(compEnd.getTime() - durationMs);
    comparisonFilter.createdAt = { $gte: compStart, $lte: compEnd };

    const [currentOrders, prevOrders] = await Promise.all([
      Order.find(currentFilter).lean(),
      Order.find(comparisonFilter).lean(),
    ]);

    const validCurrentOrders = currentOrders.filter(o => o.orderStatus !== 'CANCELLED');
    const validPrevOrders = prevOrders.filter(o => o.orderStatus !== 'CANCELLED');
    const currentRevenue = validCurrentOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const prevRevenue = validPrevOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    // A percentage is undefined when the comparison window has no revenue.
    // Do not invent +100% growth in that case.
    const growthPercentValue = prevRevenue > 0
      ? Number((((currentRevenue - prevRevenue) / prevRevenue) * 100).toFixed(1))
      : null;
    const growthLabel = growthPercentValue === null
      ? 'Not comparable (no revenue in the prior window)'
      : `${growthPercentValue >= 0 ? '+' : ''}${growthPercentValue}%`;

    const pendingOrders = currentOrders.filter(o => o.orderStatus === 'NEW' || o.orderStatus === 'CONFIRMED');
    const processingOrders = currentOrders.filter(o => o.orderStatus === 'PROCESSING');
    const shippedOrders = currentOrders.filter(o => o.orderStatus === 'SHIPPED');
    const deliveredOrders = currentOrders.filter(o => o.orderStatus === 'DELIVERED');
    const cancelledOrders = currentOrders.filter(o => o.orderStatus === 'CANCELLED');

    const codCount = validCurrentOrders.filter(o => o.paymentMethod === 'COD').length;
    const codRatio = validCurrentOrders.length > 0 ? Math.round((codCount / validCurrentOrders.length) * 100) : 0;

    // Rule-based recommendations derived only from the loaded orders.
    const recommendations = [];

    if (pendingOrders.length > 0) {
      recommendations.push({
        type: 'ACTION_REQUIRED',
        severity: 'HIGH',
        title: `${pendingOrders.length} Pending Orders Awaiting Acceptance`,
        message: 'Accept orders promptly within 2 hours to improve dispatch time and customer satisfaction.',
        action: 'ACCEPT_PENDING',
      });
    }

    if (processingOrders.length > 0) {
      recommendations.push({
        type: 'LOGISTICS',
        severity: 'MEDIUM',
        title: `${processingOrders.length} Orders Packed & Ready to Dispatch`,
        message: 'Assign courier partner and tracking numbers to send live WhatsApp tracking to buyers.',
        action: 'DISPATCH_ORDERS',
      });
    }

    if (growthPercentValue !== null && growthPercentValue >= 10) {
      recommendations.push({
        type: 'GROWTH',
        severity: 'POSITIVE',
        title: `Revenue Growth: +${growthPercentValue}%`,
        message: `The selected date window generated ₹${currentRevenue.toLocaleString('en-IN')}, compared with ₹${prevRevenue.toLocaleString('en-IN')} in the prior equivalent window.`,
        action: 'REVIEW_REVENUE_GROWTH',
      });
    }

    if (codRatio > 60) {
      recommendations.push({
        type: 'RISK_MANAGEMENT',
        severity: 'LOW',
        title: `High COD Ratio (${codRatio}%)`,
        message: 'Enable automated WhatsApp order confirmation before dispatch to reduce Return to Origin (RTO).',
        action: 'SETUP_RTO_PROTECTION',
      });
    }

    const productRevenue = new Map();
    validCurrentOrders.forEach((order) => {
      (Array.isArray(order.items) ? order.items : []).forEach((item) => {
        if (!item?.name) return;
        const quantity = Math.max(0, Number(item.quantity) || 0);
        const lineRevenue = Number.isFinite(Number(item.subtotal))
          ? Number(item.subtotal)
          : (Number(item.price) || 0) * quantity;
        const current = productRevenue.get(item.name) || { revenue: 0, quantity: 0 };
        productRevenue.set(item.name, {
          revenue: current.revenue + lineRevenue,
          quantity: current.quantity + quantity,
        });
      });
    });
    const topProduct = [...productRevenue.entries()]
      .sort((a, b) => b[1].revenue - a[1].revenue)[0];

    if (topProduct) {
      const [productName, productStats] = topProduct;
      recommendations.push({
        type: 'CATALOG_INSIGHT',
        severity: 'INFO',
        title: `Top Product: ${productName}`,
        message: `This product contributed ₹${Math.round(productStats.revenue).toLocaleString('en-IN')} across ${productStats.quantity} unit(s) in the selected window.`,
        action: 'REVIEW_TOP_PRODUCT',
      });
    }

    res.json({
      success: true,
      data: {
        window: {
          start: start.toISOString(),
          end: end.toISOString(),
          days: Math.max(1, Math.round(durationMs / (1000 * 60 * 60 * 24))),
        },
        metrics: {
          currentRevenue,
          prevRevenue,
          growthPercent: growthLabel,
          totalOrders: currentOrders.length,
          pendingOrdersCount: pendingOrders.length,
          processingOrdersCount: processingOrders.length,
          shippedOrdersCount: shippedOrders.length,
          deliveredOrdersCount: deliveredOrders.length,
          cancelledOrdersCount: cancelledOrders.length,
          codRatio: `${codRatio}%`,
          avgOrderValue: validCurrentOrders.length > 0 ? Math.round(currentRevenue / validCurrentOrders.length) : 0,
        },
        recommendations,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get complete Executive Speedometer Overview with period comparison, revenue breakdown & speedometer KPIs
// @route   GET /api/orders/executive-overview
// @access  Private (Merchant Admin/Staff)
const getExecutiveOverview = async (req, res) => {
  try {
    const businessId = req.businessId;
    const { period = '30d', startDate, endDate } = req.query;

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Executive analytics are temporarily unavailable. Please try again shortly.',
      });
    }

    const now = new Date();
    let start, end;

    if (period === 'today') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    } else if (period === '7d') {
      end = new Date(now);
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      start.setHours(0, 0, 0, 0);
    } else if (period === '30d') {
      end = new Date(now);
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      start.setHours(0, 0, 0, 0);
    } else if (period === 'custom' && startDate && endDate) {
      start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
    } else {
      end = new Date(now);
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      start.setHours(0, 0, 0, 0);
    }

    // Previous equivalent period window for comparison
    const durationMs = Math.max(1000 * 60 * 60 * 24, end.getTime() - start.getTime());
    const prevEnd = new Date(start.getTime() - 1);
    const prevStart = new Date(prevEnd.getTime() - durationMs);

    // Today midnight for "today's orders"
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    let currentOrders = [];
    let prevOrders = [];
    let todayOrdersCount = 0;
    let allProducts = [];

    [
      currentOrders,
      prevOrders,
      todayOrdersCount,
      allProducts
    ] = await Promise.all([
      Order.find({
        businessId,
        createdAt: { $gte: start, $lte: end }
      }).sort({ createdAt: -1 }).lean(),
      Order.find({
        businessId,
        createdAt: { $gte: prevStart, $lte: prevEnd }
      }).lean(),
      Order.countDocuments({
        businessId,
        createdAt: { $gte: todayStart, $lte: todayEnd }
      }),
      Product.find({ businessId }).lean()
    ]);

    // Financial & Order Breakdown - CURRENT PERIOD
    let grossSales = 0;
    let totalDiscounts = 0;
    let totalShipping = 0;
    let netSalesBooked = 0;
    let realizedCompletedCash = 0;
    let pendingCodAmount = 0;
    let refundedAmount = 0;
    let cancelledAmount = 0;

    let pendingCount = 0;
    let processingCount = 0;
    let shippedCount = 0;
    let deliveredCount = 0;
    let cancelledCount = 0;
    let nonCancelledCount = 0;

    const productSalesMap = {};

    currentOrders.forEach((o) => {
      const isCancelled = o.orderStatus === 'CANCELLED';
      const isDelivered = o.orderStatus === 'DELIVERED';
      const isShipped = o.orderStatus === 'SHIPPED';
      const isProcessing = o.orderStatus === 'PROCESSING';
      const isPending = o.orderStatus === 'NEW' || o.orderStatus === 'CONFIRMED';
      const isPaid = o.paymentStatus === 'PAID';
      const isRefunded = o.paymentStatus === 'REFUNDED';
      const isCod = o.paymentMethod === 'COD';

      if (isCancelled) {
        cancelledCount++;
        cancelledAmount += (o.totalAmount || 0);
      } else {
        nonCancelledCount++;
        grossSales += (o.subtotal || o.totalAmount || 0);
        totalDiscounts += (o.discount || 0);
        totalShipping += (o.shippingFee || 0);
        netSalesBooked += (o.totalAmount || 0);

        if (isPending) pendingCount++;
        if (isProcessing) processingCount++;
        if (isShipped) shippedCount++;
        if (isDelivered) deliveredCount++;

        // Revenue realization logic:
        // Cash is realized if paid online OR delivered via COD
        if (isPaid && !isRefunded) {
          realizedCompletedCash += (o.totalAmount || 0);
        } else if (isCod && isDelivered) {
          realizedCompletedCash += (o.totalAmount || 0);
        } else if (isCod && !isDelivered) {
          pendingCodAmount += (o.totalAmount || 0);
        }

        if (isRefunded) {
          refundedAmount += (o.totalAmount || 0);
        }

        // Top products tracking
        if (Array.isArray(o.items)) {
          o.items.forEach((item) => {
            const key = item.productId ? item.productId.toString() : item.name;
            if (!productSalesMap[key]) {
              productSalesMap[key] = {
                id: key,
                name: item.name || 'Unnamed item',
                variant: item.variantName || '',
                image: item.image || '',
                quantitySold: 0,
                revenueGenerated: 0,
              };
            }
            productSalesMap[key].quantitySold += (item.quantity || 1);
            productSalesMap[key].revenueGenerated += (item.subtotal || (item.price * (item.quantity || 1)) || 0);
          });
        }
      }
    });

    // Financial & Order Breakdown - PREVIOUS PERIOD
    let prevNetSales = 0;
    let prevCompletedCash = 0;

    prevOrders.forEach((o) => {
      if (o.orderStatus !== 'CANCELLED') {
        prevNetSales += (o.totalAmount || 0);
        if (o.paymentStatus === 'PAID' || (o.paymentMethod === 'COD' && o.orderStatus === 'DELIVERED')) {
          prevCompletedCash += (o.totalAmount || 0);
        }
      }
    });

    // Growth percentage helpers
    const calcGrowth = (curr, prev) => {
      if (prev === 0) return null;
      return parseFloat((((curr - prev) / prev) * 100).toFixed(1));
    };

    const ordersGrowthPct = calcGrowth(currentOrders.length, prevOrders.length);
    const netSalesGrowthPct = calcGrowth(netSalesBooked, prevNetSales);
    const completedCashGrowthPct = calcGrowth(realizedCompletedCash, prevCompletedCash);

    // Inventory Alerts & Stock Health
    const lowStockThreshold = 10;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let healthyStockCount = 0;

    const lowStockProducts = [];

    allProducts.forEach((p) => {
      const stock = p.stockQuantity !== undefined ? p.stockQuantity : 0;
      const isAvailable = p.isAvailable !== false;
      const isCritical = stock <= 0 || !isAvailable;
      const isLow = stock > 0 && stock <= lowStockThreshold;

      if (isCritical) {
        outOfStockCount++;
        lowStockProducts.push({
          id: p._id,
          name: p.name,
          slug: p.slug,
          price: p.price,
          stockQuantity: stock,
          status: 'OUT_OF_STOCK',
          alertLevel: 'CRITICAL',
          image: getPrimaryImageUrl(p.images),
        });
      } else if (isLow) {
        lowStockCount++;
        lowStockProducts.push({
          id: p._id,
          name: p.name,
          slug: p.slug,
          price: p.price,
          stockQuantity: stock,
          status: 'LOW_STOCK',
          alertLevel: 'WARNING',
          image: getPrimaryImageUrl(p.images),
        });
      } else {
        healthyStockCount++;
      }
    });

    lowStockProducts.sort((a, b) => a.stockQuantity - b.stockQuantity);

    const totalProductsCount = allProducts.length;
    const inventoryAlertsCount = lowStockCount + outOfStockCount;

    // Top selling products sorted
    const topSellingProducts = Object.values(productSalesMap)
      .sort((a, b) => b.quantitySold - a.quantitySold)
      .slice(0, 5);

    // Speedometer Indicators Calculations
    // 1. Order Fulfillment Velocity
    const fulfillmentRate = nonCancelledCount > 0
      ? parseFloat((((shippedCount + deliveredCount) / nonCancelledCount) * 100).toFixed(1))
      : 0;
    const fulfillmentTarget = 90.0;

    // 2. Revenue compared with the prior equivalent period. No arbitrary
    // benchmark is invented when the prior period has no revenue.
    const revenueComparisonPct = prevNetSales > 0
      ? parseFloat(((netSalesBooked / prevNetSales) * 100).toFixed(1))
      : null;

    // 3. Payment Realization Rate
    const paymentRealizationRate = netSalesBooked > 0
      ? parseFloat(((realizedCompletedCash / netSalesBooked) * 100).toFixed(1))
      : 0;
    const paymentRealizationTarget = 80.0;

    // 4. Catalog Stock Health Index
    const stockHealthIndex = totalProductsCount > 0
      ? parseFloat(((healthyStockCount / totalProductsCount) * 100).toFixed(1))
      : 0;
    const stockHealthTarget = 95.0;

    const daysInPeriod = Math.max(1, Math.round(durationMs / (1000 * 60 * 60 * 24)));
    const hasFulfillmentData = nonCancelledCount > 0;
    const hasPaymentData = netSalesBooked > 0;
    const hasStockData = totalProductsCount > 0;

    const speedometers = [
      {
        id: 'fulfillment-velocity',
        title: 'Fulfillment Velocity',
        category: 'Operations',
        unit: '%',
        value: fulfillmentRate,
        target: fulfillmentTarget,
        min: 0,
        max: 100,
        formula: '((Shipped + Delivered Orders) / Non-Cancelled Orders) × 100',
        actualDisplay: `${fulfillmentRate}% (${shippedCount + deliveredCount}/${nonCancelledCount})`,
        targetDisplay: `Target: ${fulfillmentTarget}%`,
        status: !hasFulfillmentData ? 'NO_DATA' : fulfillmentRate >= fulfillmentTarget ? 'OPTIMAL' : fulfillmentRate >= 60 ? 'CRUISING' : 'ATTENTION',
        statusLabel: !hasFulfillmentData ? 'No non-cancelled orders in this period' : fulfillmentRate >= fulfillmentTarget ? 'Peak Velocity' : fulfillmentRate >= 60 ? 'Standard Pace' : 'Action Needed',
        colorZone: !hasFulfillmentData ? 'slate' : fulfillmentRate >= fulfillmentTarget ? 'emerald' : fulfillmentRate >= 60 ? 'amber' : 'rose',
      },
      {
        id: 'revenue-velocity',
        title: 'Revenue vs Prior Period',
        category: 'Financial Performance',
        unit: '₹',
        value: revenueComparisonPct === null ? 0 : Math.min(120, revenueComparisonPct),
        percentage: revenueComparisonPct,
        target: 100,
        min: 0,
        max: 120,
        formula: '(Current Net Sales / Prior-Period Net Sales) × 100',
        actualDisplay: `₹${netSalesBooked.toLocaleString('en-IN')}`,
        targetDisplay: `Prior period: ₹${prevNetSales.toLocaleString('en-IN')}`,
        status: revenueComparisonPct === null ? 'NO_DATA' : revenueComparisonPct >= 100 ? 'OPTIMAL' : revenueComparisonPct >= 70 ? 'CRUISING' : 'ATTENTION',
        statusLabel: revenueComparisonPct === null ? 'No prior-period revenue to compare' : revenueComparisonPct >= 100 ? 'Above Prior Period' : revenueComparisonPct >= 70 ? 'Near Prior Period' : 'Behind Prior Period',
        colorZone: revenueComparisonPct === null ? 'slate' : revenueComparisonPct >= 100 ? 'emerald' : revenueComparisonPct >= 70 ? 'indigo' : 'amber',
      },
      {
        id: 'payment-realization',
        title: 'Payment Realization Rate',
        category: 'Cash Flow & Liquidity',
        unit: '%',
        value: paymentRealizationRate,
        target: paymentRealizationTarget,
        min: 0,
        max: 100,
        formula: '(Realized Paid Cash / Booked Net Sales) × 100',
        actualDisplay: `${paymentRealizationRate}% (₹${realizedCompletedCash.toLocaleString('en-IN')})`,
        targetDisplay: `Target: ${paymentRealizationTarget}%`,
        status: !hasPaymentData ? 'NO_DATA' : paymentRealizationRate >= paymentRealizationTarget ? 'OPTIMAL' : paymentRealizationRate >= 50 ? 'CRUISING' : 'ATTENTION',
        statusLabel: !hasPaymentData ? 'No booked net sales to compare' : paymentRealizationRate >= paymentRealizationTarget ? 'High Realization' : paymentRealizationRate >= 50 ? 'Standard Flow' : 'Pending COD Lag',
        colorZone: !hasPaymentData ? 'slate' : paymentRealizationRate >= paymentRealizationTarget ? 'emerald' : paymentRealizationRate >= 50 ? 'purple' : 'rose',
      },
      {
        id: 'stock-health',
        title: 'Catalog Stock Health Index',
        category: 'Inventory Quality',
        unit: '%',
        value: stockHealthIndex,
        target: stockHealthTarget,
        min: 0,
        max: 100,
        formula: '(Healthy Stock Products / Total Catalog Products) × 100',
        actualDisplay: hasStockData ? `${stockHealthIndex}% (${healthyStockCount}/${totalProductsCount} SKUs)` : 'No products in catalog',
        targetDisplay: `Target: ${stockHealthTarget}%`,
        status: !hasStockData ? 'NO_DATA' : stockHealthIndex >= stockHealthTarget ? 'OPTIMAL' : stockHealthIndex >= 75 ? 'CRUISING' : 'ATTENTION',
        statusLabel: !hasStockData ? 'No catalog data' : stockHealthIndex >= stockHealthTarget ? 'Optimal Stock' : stockHealthIndex >= 75 ? 'Low Stock Alerts' : 'Critical Depletion',
        colorZone: !hasStockData ? 'slate' : stockHealthIndex >= stockHealthTarget ? 'emerald' : stockHealthIndex >= 75 ? 'amber' : 'rose',
      },
    ];

    // Daily chart aggregation
    const dailyMap = {};
    const dayCursor = new Date(start);
    while (dayCursor <= end) {
      const dKey = dayCursor.toISOString().split('T')[0];
      dailyMap[dKey] = {
        date: dKey,
        dayLabel: dayCursor.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        revenue: 0,
        ordersCount: 0,
        deliveredCount: 0,
      };
      dayCursor.setDate(dayCursor.getDate() + 1);
    }

    currentOrders.forEach((o) => {
      const dKey = new Date(o.createdAt).toISOString().split('T')[0];
      if (dailyMap[dKey]) {
        dailyMap[dKey].ordersCount++;
        if (o.orderStatus !== 'CANCELLED') {
          dailyMap[dKey].revenue += (o.totalAmount || 0);
        }
        if (o.orderStatus === 'DELIVERED') {
          dailyMap[dKey].deliveredCount++;
        }
      }
    });

    const dailyTrend = Object.values(dailyMap);

    // Recent orders formatted for table
    const recentOrders = currentOrders.slice(0, 10).map((o) => ({
      id: o._id,
      orderNumber: o.orderNumber,
      customerName: o.customerName,
      customerPhone: o.customerPhone,
      customerEmail: o.customerEmail,
      itemsCount: o.items?.length || 0,
      itemsSummary: o.items?.map(i => `${i.name} (x${i.quantity})`).join(', ') || 'No line items',
      totalAmount: o.totalAmount,
      paymentMethod: o.paymentMethod,
      paymentStatus: o.paymentStatus,
      orderStatus: o.orderStatus,
      createdAt: o.createdAt,
      displayDate: new Date(o.createdAt).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    }));

    res.json({
      success: true,
      data: {
        period,
        dateRange: {
          start: start.toISOString(),
          end: end.toISOString(),
          days: daysInPeriod,
        },
        comparisonRange: {
          start: prevStart.toISOString(),
          end: prevEnd.toISOString(),
        },
        kpis: {
          totalOrders: currentOrders.length,
          prevTotalOrders: prevOrders.length,
          ordersGrowthPct,
          todayOrdersCount,
          pendingOrdersCount: pendingCount,
          processingOrdersCount: processingCount,
          shippedOrdersCount: shippedCount,
          completedOrdersCount: deliveredCount,
          cancellationsCount: cancelledCount,
          cancellationRatePct: currentOrders.length > 0
            ? parseFloat(((cancelledCount / currentOrders.length) * 100).toFixed(1))
            : 0,
          inventoryAlertsCount,
          outOfStockCount,
          lowStockCount,
          totalProductsCount,
          averageOrderValue: nonCancelledCount > 0 ? Math.round(netSalesBooked / nonCancelledCount) : 0,
        },
        financials: {
          grossSales,
          totalDiscounts,
          totalShipping,
          netSalesBooked,
          prevNetSales,
          netSalesGrowthPct,
          realizedCompletedCash,
          prevCompletedCash,
          completedCashGrowthPct,
          pendingCodAmount,
          refundedAmount,
          cancelledAmount,
          currency: 'INR',
          currencySymbol: '₹',
        },
        speedometers,
        recentOrders,
        topSellingProducts,
        lowStockProducts,
        dailyTrend,
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getOrders,
  getOrderById,
  updateOrderStatus,
  getOrderStats,
  getAiOrderInsights,
  getExecutiveOverview,
};

