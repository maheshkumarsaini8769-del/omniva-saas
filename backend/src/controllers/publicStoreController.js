const mongoose = require('mongoose');
const crypto = require('crypto');
const Tenant = require('../models/Tenant');
const Category = require('../models/Category');
const Product = require('../models/Product');
const ServicePackage = require('../models/ServicePackage');
const Order = require('../models/Order');
const Lead = require('../models/Lead');
const Coupon = require('../models/Coupon');
const { sendCapiEvent } = require('../services/metaCapiService');
const { getPrimaryImageUrl } = require('../utils/productImages');
const { triggerAutomation } = require('../services/automationEngine');
const { buildAppUrl } = require('../utils/appUrl');

// Collision-resistant order number: base36 timestamp plus three random bytes.
const generateOrderNumber = () => {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `ORD-${ts}-${rand}`;
};

// Canonical Indian mobile input for both order storage and CRM matching.
const normalizeIndianPhone = (value) => {
  let digits = String(value || '').replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    digits = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1);
  }
  return digits;
};

// Match orders/leads written before phone normalization without using a
// substring regex (which can match another customer's longer number).
const phoneLookupVariants = (value) => {
  const digits = String(value || '').replace(/\D/g, '');
  const last10 = digits.slice(-10);
  if (!/^[6-9]\d{9}$/.test(last10)) return [];
  return [...new Set([last10, `91${last10}`, `0${last10}`])];
};

// Restore stock when a multi-item decrement or the subsequent order insert fails.
// Without this, an out-of-stock item later in the cart leaves earlier items
// permanently decremented even though no order was created.
const restoreDecrementedStock = async (decrementedItems) => {
  for (const item of [...decrementedItems].reverse()) {
    try {
      if (item.variantId) {
        await Product.updateOne(
          { _id: item.productId, 'variants._id': item.variantId },
          { $inc: { 'variants.$.stockQuantity': item.quantity } }
        );
      } else {
        await Product.updateOne(
          { _id: item.productId },
          { $inc: { stockQuantity: item.quantity } }
        );
      }
    } catch (restoreErr) {
      console.error('[Stock Rollback Error]:', restoreErr.message);
    }
  }
};

// @desc    Get public storefront data (Tenant info, categories, active products, service packages)
// @route   GET /api/public/store/:slug
// @access  Public
const getPublicStore = async (req, res) => {
  try {
    const { slug } = req.params;

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Storefront is temporarily unavailable. Please try again shortly.',
      });
    }

    const tenant = await Tenant.findOne({ slug, status: 'ACTIVE' }).select(
      'businessName slug businessType templateCode enabledModules branding contact settings.currency settings.currencySymbol settings.enableCOD settings.enableOnlinePay settings.minOrderValue settings.shippingFee settings.freeShippingThreshold settings.metaPixelId'
    );

    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Storefront not found or inactive' });
    }

    const [categories, products, packages, coupons] = await Promise.all([
      Category.find({ businessId: tenant._id, isActive: true })
        .sort({ orderIndex: 1, name: 1 })
        .select('name slug description image orderIndex'),
      Product.find({ businessId: tenant._id, isAvailable: true })
        .sort({ createdAt: -1 })
        .populate('categoryId', 'name slug image')
        .select('name slug description price compareAtPrice images stockQuantity trackQuantity isAvailable tags categoryId variants._id variants.name variants.sku variants.price variants.compareAtPrice variants.stockQuantity variants.attributes'),
      ServicePackage.find({ businessId: tenant._id, isAvailable: true })
        .sort({ price: 1 })
        .select('name slug category description duration price advanceTokenPercent deliverables images maxCapacityPerDay isAvailable'),
      Coupon.find({
        businessId: tenant._id,
        isActive: true,
        $or: [{ expiresAt: null }, { expiresAt: { $gte: new Date() } }],
      }).select('code title description discountType discountValue minOrderValue maxDiscount expiresAt'),
    ]);

    res.json({
      success: true,
      data: {
        store: tenant,
        categories,
        products,
        packages,
        coupons: coupons,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single product details
// @route   GET /api/public/store/:slug/product/:productSlug
// @access  Public
const getPublicProduct = async (req, res) => {
  try {
    const { slug, productSlug } = req.params;

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Storefront is temporarily unavailable. Please try again shortly.',
      });
    }

    const tenant = await Tenant.findOne({ slug, status: 'ACTIVE' }).select('_id businessName slug');
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Store not found' });
    }

    const product = await Product.findOne({
      businessId: tenant._id,
      slug: productSlug,
      isAvailable: true,
    })
      .populate('categoryId', 'name slug')
      .select('name slug description price compareAtPrice images stockQuantity trackQuantity isAvailable tags categoryId variants._id variants.name variants.sku variants.price variants.compareAtPrice variants.stockQuantity variants.attributes');

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a public order (COD or Online)
// @route   POST /api/public/store/:slug/orders
// @access  Public
const createPublicOrder = async (req, res) => {
  try {
    const { slug } = req.params;
    const {
      customerName,
      customerPhone,
      customerEmail,
      shippingAddress,
      items,
      paymentMethod,
      couponCode = '',
      attribution = {},
      notes,
    } = req.body;

    if (!customerName || !customerPhone || !shippingAddress || !items || !items.length) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: customerName, customerPhone, shippingAddress, and at least one item',
      });
    }

    const { street, city, pincode } = shippingAddress;
    if (!street || !city || !pincode) {
      return res.status(400).json({
        success: false,
        message: 'Street, city, and pincode are required in shipping address',
      });
    }

    // Strict Indian Mobile Number Validation (10 digits starting with 6-9, handles +91 / 91 / 0 prefix)
    const cleanCustomerPhone = normalizeIndianPhone(customerPhone);

    if (cleanCustomerPhone.length !== 10 || !/^[6-9]\d{9}$/.test(cleanCustomerPhone)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid mobile number. Please provide a valid 10-digit Indian phone number (starting with 6, 7, 8, or 9).',
      });
    }

    // Strict Indian PIN Code Validation (6 digits, first digit 1-9)
    const cleanPincode = (pincode || '').toString().replace(/\D/g, '');
    if (cleanPincode.length !== 6 || !/^[1-9][0-9]{5}$/.test(cleanPincode)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid PIN code. Please provide a valid 6-digit Indian postal PIN code (e.g. 110001, 302001).',
      });
    }

    // Collision-resistant order number; collisions are retried below.
    let orderNumber = generateOrderNumber();
    // Discount is always derived server-side from a validated coupon.
    let appliedDiscount = 0;
    let validatedCoupon = null;
    const cleanCouponCode = (couponCode || '').toString().trim().toUpperCase();

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Store is temporarily unable to accept orders. Please try again shortly.',
      });
    }

    const tenant = await Tenant.findOne({ slug, status: 'ACTIVE' });
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Storefront not found or inactive' });
    }

    const idempotencyKey = String(req.headers['x-idempotency-key'] || req.body.idempotencyKey || '')
      .trim()
      .slice(0, 128);
    if (idempotencyKey) {
      const existingOrder = await Order.findOne({
        businessId: tenant._id,
        idempotencyKey,
      });
      if (existingOrder) {
        return res.status(200).json({
          success: true,
          message: 'Order already placed',
          data: {
            _id: existingOrder._id,
            orderId: existingOrder._id,
            orderNumber: existingOrder.orderNumber,
            customerName: existingOrder.customerName,
            customerPhone: existingOrder.customerPhone,
            totalAmount: existingOrder.totalAmount,
            paymentMethod: existingOrder.paymentMethod,
            orderStatus: existingOrder.orderStatus,
            shippingFee: existingOrder.shippingFee,
            itemsCount: existingOrder.items.length,
          },
        });
      }
    }

    // Validate the coupon against this tenant's records before trusting it.
    if (cleanCouponCode) {
      validatedCoupon = await Coupon.findOne({
        businessId: tenant._id,
        code: cleanCouponCode,
        isActive: true,
        $or: [{ expiresAt: null }, { expiresAt: { $gte: new Date() } }],
      });

      if (!validatedCoupon) {
        return res.status(400).json({
          success: false,
          message: `Coupon "${cleanCouponCode}" is invalid or expired`,
        });
      }
      if (validatedCoupon.usageLimit > 0 && validatedCoupon.usageCount >= validatedCoupon.usageLimit) {
        return res.status(400).json({
          success: false,
          message: `Coupon "${cleanCouponCode}" has reached its usage limit`,
        });
      }
    }

    // Verify each item against database pricing and inventory
    let verifiedSubtotal = 0;
    const verifiedItems = [];

    for (const cartItem of items) {
      let product = null;
      const suppliedValidId =
        Boolean(cartItem.productId) && mongoose.Types.ObjectId.isValid(cartItem.productId);

      // Safe lookup: only query _id if cartItem.productId is a valid 24-char hex ObjectId
      if (suppliedValidId) {
        product = await Product.findOne({
          _id: cartItem.productId,
          businessId: tenant._id,
          isAvailable: true,
        });
      }

      // A valid id that no longer resolves means the product was deleted or
      // made unavailable. Never substitute a different same-named product.
      if (!product && suppliedValidId) {
        return res.status(400).json({
          success: false,
          message: `Product ${cartItem.name || cartItem.productId} is no longer available`,
        });
      }

      // Fallback lookup by name or slug for legacy carts that sent a slug
      // instead of an id (still scoped to this tenant). Only add defined values
      // so an empty payload cannot match an arbitrary product.
      if (!product) {
        const fallbackMatchers = [];
        if (cartItem.name) fallbackMatchers.push({ name: cartItem.name });
        if (cartItem.productId) fallbackMatchers.push({ slug: cartItem.productId });
        if (cartItem.slug) fallbackMatchers.push({ slug: cartItem.slug });

        if (fallbackMatchers.length > 0) {
          product = await Product.findOne({
            businessId: tenant._id,
            isAvailable: true,
            $or: fallbackMatchers,
          });
        }
      }

      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Product ${cartItem.name || cartItem.productId} is not available`,
        });
      }

      const qty = parseInt(cartItem.quantity, 10);
      if (isNaN(qty) || qty <= 0) {
        return res.status(400).json({ success: false, message: 'Invalid item quantity' });
      }

      let unitPrice = product.price;
      let variantName = cartItem.variantName || '';
      let targetVariantId = null;

      if (product.variants && product.variants.length > 0) {
        let variant = null;
        // ONLY call product.variants.id if cartItem.variantId is a valid ObjectId
        if (cartItem.variantId && mongoose.Types.ObjectId.isValid(cartItem.variantId)) {
          variant = product.variants.id(cartItem.variantId);
        }

        // Match by variant name or jar name
        if (!variant) {
          variant = product.variants.find(
            (v) =>
              v.name?.toLowerCase() === (cartItem.variantName || cartItem.variantId || '')?.toLowerCase()
          );
        }

        // No variant requested: choose the first server-side variant.
        // This keeps checkout usable without ever trusting a client price.
        if (!variant && !cartItem.variantId && !cartItem.variantName) {
          variant = product.variants[0];
        }

        if (variant) {
          targetVariantId = variant._id.toString();
          unitPrice = variant.price;
          variantName = variant.name;

          // Inventory check on variant
          if (product.trackQuantity && variant.stockQuantity < qty) {
            return res.status(400).json({
              success: false,
              message: `Insufficient stock for ${product.name} (${variant.name})`,
            });
          }
        } else {
          // Never trust a client-supplied price when the product has variants.
          return res.status(400).json({
            success: false,
            message: `Please select a valid variant for ${product.name}`,
          });
        }
      } else {
        // Server price always wins for products without variants.
        // Inventory check on main product
        if (product.trackQuantity && product.stockQuantity < qty) {
          return res.status(400).json({
            success: false,
            message: `Insufficient stock for ${product.name}. Available: ${product.stockQuantity}`,
          });
        }
      }

      const itemSubtotal = unitPrice * qty;
      verifiedSubtotal += itemSubtotal;

      verifiedItems.push({
        productId: product._id,
        variantId: targetVariantId,
        name: product.name,
        variantName,
        price: unitPrice,
        quantity: qty,
        subtotal: itemSubtotal,
        image: getPrimaryImageUrl(product.images),
        trackQuantity: Boolean(product.trackQuantity),
      });
    }

    // Validate minimum order value and compute the discount server-side.
    if (validatedCoupon) {
      if (validatedCoupon.minOrderValue > 0 && verifiedSubtotal < validatedCoupon.minOrderValue) {
        return res.status(400).json({
          success: false,
          message: `Minimum order of ₹${validatedCoupon.minOrderValue} is required for coupon "${cleanCouponCode}"`,
        });
      }

      if (validatedCoupon.discountType === 'PERCENTAGE') {
        appliedDiscount = Math.round(
          (verifiedSubtotal * Number(validatedCoupon.discountValue)) / 100
        );
        if (validatedCoupon.maxDiscount > 0 && appliedDiscount > validatedCoupon.maxDiscount) {
          appliedDiscount = validatedCoupon.maxDiscount;
        }
      } else {
        appliedDiscount = Math.min(
          Number(validatedCoupon.discountValue) || 0,
          verifiedSubtotal
        );
      }

      // A coupon can never discount more than the verified cart value.
      appliedDiscount = Math.min(appliedDiscount, verifiedSubtotal);
    }

    // Shipping thresholds are merchant-configured. Defaults preserve the
    // historical free-shipping-over-₹499 / ₹50 rule for existing tenants.
    const freeShippingThreshold = Number(tenant.settings?.freeShippingThreshold ?? 499);
    const configuredShippingFee = Number(tenant.settings?.shippingFee ?? 50);
    const minimumOrderValue = Number(tenant.settings?.minOrderValue ?? 0);
    if (minimumOrderValue > 0 && verifiedSubtotal < minimumOrderValue) {
      return res.status(400).json({
        success: false,
        message: `Minimum order value of ₹${minimumOrderValue} is required`,
      });
    }
    const shippingFee =
      freeShippingThreshold > 0 && verifiedSubtotal >= freeShippingThreshold
        ? 0
        : Math.max(0, configuredShippingFee);
    const totalAmount = Math.max(0, verifiedSubtotal - appliedDiscount + shippingFee);

    const normalizedPaymentMethod = String(paymentMethod || '').toUpperCase();
    // No Razorpay order is created and no checkout is initiated in this flow.
    // Reject ONLINE so a customer is never told they paid when they did not.
    if (normalizedPaymentMethod === 'ONLINE') {
      return res.status(400).json({
        success: false,
        message: 'Online payment is currently unavailable. Please choose Cash on Delivery (COD).',
      });
    }
    if (normalizedPaymentMethod !== 'COD') {
      return res.status(400).json({ success: false, message: 'Unsupported payment method' });
    }
    if (tenant.settings?.enableCOD === false) {
      return res.status(400).json({ success: false, message: 'Cash on Delivery is not enabled for this store' });
    }

    // Atomically decrement stock with $gte check to eliminate TOCTOU race conditions.
    // Track every successful decrement so a later failure can roll the cart back.
    const decrementedStock = [];
    for (const item of verifiedItems) {
      if (item.variantId) {
        if (item.trackQuantity) {
          const decResult = await Product.updateOne(
            { _id: item.productId, 'variants._id': item.variantId, 'variants.stockQuantity': { $gte: item.quantity } },
            { $inc: { 'variants.$.stockQuantity': -item.quantity } }
          );
          if (decResult.modifiedCount === 0) {
            await restoreDecrementedStock(decrementedStock);
            return res.status(400).json({
              success: false,
              message: `Insufficient stock for ${item.name} (${item.variantName || 'selected variant'}). Another customer just completed their purchase!`,
            });
          }
          decrementedStock.push({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
          });
        } else {
          // This product opts out of inventory tracking. Do not drive its
          // stockQuantity negative or pretend it was decremented.
        }
      } else {
        if (item.trackQuantity) {
          const decResult = await Product.updateOne(
            { _id: item.productId, stockQuantity: { $gte: item.quantity } },
            { $inc: { stockQuantity: -item.quantity } }
          );
          if (decResult.modifiedCount === 0) {
            await restoreDecrementedStock(decrementedStock);
            return res.status(400).json({
              success: false,
              message: `Insufficient stock for ${item.name}. Another customer just completed their purchase!`,
            });
          }
          decrementedStock.push({
            productId: item.productId,
            quantity: item.quantity,
          });
        } else {
          // This product opts out of inventory tracking. Leave stock untouched.
        }
      }
    }

    // Capture client IP and User Agent
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
    const userAgent = req.headers['user-agent'] || '';

    const enrichedAttribution = {
      ...attribution,
      clientIp: attribution.clientIp || clientIp,
      userAgent: attribution.userAgent || userAgent,
    };

    // Check for recent duplicate order with same phone number placed in last 24 hours
    let isDuplicateOrder = false;
    try {
      const phoneVariants = phoneLookupVariants(cleanCustomerPhone);
      if (phoneVariants.length) {
        const recentOrder = await Order.findOne({
          businessId: tenant._id,
          customerPhone: { $in: phoneVariants },
          createdAt: { $gte: new Date(Date.now() - 24 * 3600 * 1000) },
        });
        if (recentOrder) {
          isDuplicateOrder = true;
        }
      }
    } catch (dupErr) {
      console.warn('[Duplicate Check Warning]:', dupErr.message);
    }

    // Reserve one coupon use atomically before creating the order. A plain
    // "validate, then increment later" flow lets concurrent checkouts exceed
    // the configured usage limit.
    let couponReserved = false;
    if (validatedCoupon) {
      let reservedCoupon = null;
      try {
        reservedCoupon = await Coupon.findOneAndUpdate(
          {
            _id: validatedCoupon._id,
            isActive: true,
            $or: [{ expiresAt: null }, { expiresAt: { $gte: new Date() } }],
            $expr: {
              $or: [
                { $eq: ['$usageLimit', 0] },
                { $lt: ['$usageCount', '$usageLimit'] },
              ],
            },
          },
          { $inc: { usageCount: 1 } }
        );
      } catch (couponErr) {
        await restoreDecrementedStock(decrementedStock);
        throw couponErr;
      }
      if (!reservedCoupon) {
        await restoreDecrementedStock(decrementedStock);
        return res.status(400).json({
          success: false,
          message: `Coupon "${cleanCouponCode}" has reached its usage limit`,
        });
      }
      couponReserved = true;
    }

    // Create Order. Retry only on an order-number collision; keep stock and
    // coupon reservations in place for those retries. On final failure, restore
    // both before returning or surfacing the error.
    let order = null;
    let lastOrderErr = null;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        order = await Order.create({
          businessId: tenant._id,
          orderNumber,
          idempotencyKey: idempotencyKey || undefined,
          customerName,
          customerPhone: cleanCustomerPhone,
          customerEmail: customerEmail || '',
          shippingAddress: { ...shippingAddress, pincode: cleanPincode },
          items: verifiedItems,
          subtotal: verifiedSubtotal,
          shippingFee,
          discount: appliedDiscount,
          couponCode: cleanCouponCode,
          totalAmount,
          paymentMethod: normalizedPaymentMethod,
          paymentStatus: 'PENDING',
          orderStatus: 'NEW',
          stockDecremented: decrementedStock.length > 0,
          attribution: enrichedAttribution,
          notes: notes || '',
          timeline: [
            {
              status: 'NEW',
              note: isDuplicateOrder
                ? `Order placed online via storefront (${normalizedPaymentMethod}) - [Fraud Flag: Duplicate phone in 24h]`
                : `Order placed online via storefront (${normalizedPaymentMethod})`,
              updatedBy: 'Customer',
              timestamp: new Date(),
            },
          ],
        });
        break;
      } catch (orderErr) {
        lastOrderErr = orderErr;
        const isOrderNumberDuplicate =
          orderErr.code === 11000 &&
          Boolean(
            orderErr.keyPattern?.orderNumber ||
              String(orderErr.message || '').includes('orderNumber')
          );
        if (isOrderNumberDuplicate && attempt < 2) {
          orderNumber = generateOrderNumber();
          continue;
        }
        break;
      }
    }

    if (!order) {
      await restoreDecrementedStock(decrementedStock);
      if (couponReserved) {
        try {
          await Coupon.updateOne(
            { _id: validatedCoupon._id, usageCount: { $gt: 0 } },
            { $inc: { usageCount: -1 } }
          );
        } catch (couponRollbackErr) {
          console.warn('[Coupon rollback warning]:', couponRollbackErr.message);
        }
      }

      // A concurrent retry with the same idempotency key won the unique index.
      // Return that order instead of surfacing a 500 or creating a duplicate.
      if (lastOrderErr.code === 11000 && idempotencyKey) {
        const existingOrder = await Order.findOne({
          businessId: tenant._id,
          idempotencyKey,
        });
        if (existingOrder) {
          return res.status(200).json({
            success: true,
            message: 'Order already placed',
            data: {
              _id: existingOrder._id,
              orderId: existingOrder._id,
              orderNumber: existingOrder.orderNumber,
              customerName: existingOrder.customerName,
              customerPhone: existingOrder.customerPhone,
              totalAmount: existingOrder.totalAmount,
              paymentMethod: existingOrder.paymentMethod,
              orderStatus: existingOrder.orderStatus,
              shippingFee: existingOrder.shippingFee,
              itemsCount: existingOrder.items.length,
            },
          });
        }
      }

      throw lastOrderErr;
    }

    // Fire Automation Engine Event (Trigger -> Condition -> Action)
    const trackingUrl = buildAppUrl(
      req,
      `/orders/track?${new URLSearchParams({
        orderNumber: order.orderNumber || '',
        phone: order.customerPhone || '',
        slug: slug || '',
      }).toString()}`
    );
    await triggerAutomation({
      businessId: tenant._id,
      trigger: 'ORDER_CREATED',
      entityType: 'ORDER',
      entityId: order._id.toString(),
      data: {
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        totalAmount: order.totalAmount,
        paymentMethod: order.paymentMethod,
        shippingCity: order.shippingAddress?.city || '',
        isDuplicate: isDuplicateOrder ? 'true' : 'false',
        itemsCount: order.items?.length || 0,
        productName: order.items?.[0]?.name || 'Unnamed item',
        trackingUrl,
      },
    }).catch((err) => console.error('[Automation Trigger Error]:', err.message));

    // Sync Customer / Order into CRM Lead Pipeline
    try {
      const existingLead = await Lead.findOne({ businessId: tenant._id, phone: cleanCustomerPhone });

      if (existingLead) {
        existingLead.status = 'WON';
        existingLead.budget = (existingLead.budget || 0) + totalAmount;
        existingLead.notes.push({
          note: `Placed order ${orderNumber} for ₹${totalAmount}`,
          authorName: 'Storefront Checkout',
          createdAt: new Date(),
        });
        await existingLead.save();
      } else {
        await Lead.create({
          businessId: tenant._id,
          name: customerName,
          phone: cleanCustomerPhone,
          email: customerEmail || '',
          source: 'WEBSITE',
          campaignName: enrichedAttribution.utmCampaign || '',
          utmSource: enrichedAttribution.utmSource || '',
          utmCampaign: enrichedAttribution.utmCampaign || '',
          status: 'WON',
          budget: totalAmount,
          notes: [
            {
              note: `First order ${orderNumber} placed for ₹${totalAmount}`,
              authorName: 'Storefront Checkout',
              createdAt: new Date(),
            },
          ],
        });
      }
    } catch (leadSyncErr) {
      console.error('[CRM Lead Sync Warning]:', leadSyncErr.message);
    }

    // Fire Meta CAPI Purchase Conversion Event asynchronously if credentials configured
    const metaPixelId =
      tenant.settings?.metaPixelId || tenant.integrations?.meta?.pixelId;
    const metaCapiToken =
      tenant.settings?.metaCapiToken || tenant.integrations?.meta?.capiToken;
    if (metaPixelId && metaCapiToken) {
      sendCapiEvent({
        tenant,
        eventName: 'Purchase',
        eventId: order.orderNumber,
        eventSourceUrl: req.headers.referer || `https://${req.get('host')}/store/${slug}`,
        userData: {
          email: customerEmail,
          phone: customerPhone,
          fbclid: enrichedAttribution.fbclid,
        },
        customData: {
          currency: tenant.settings.currency || 'INR',
          value: totalAmount,
          contentName: verifiedItems.map((i) => i.name).join(', '),
        },
      }).catch((capiErr) => console.error('[CAPI Purchase Event Error]:', capiErr.message));
    }

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: {
        _id: order._id,
        orderId: order._id,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        totalAmount: order.totalAmount,
        paymentMethod: order.paymentMethod,
        orderStatus: order.orderStatus,
        shippingFee: order.shippingFee,
        itemsCount: order.items.length,
      },
    });
  } catch (error) {
    console.error('[Order Processing Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to place order right now. Please try again.',
    });
  }
};

// @desc    Track public order status
// @route   GET /api/public/orders/track
// @access  Public
const trackPublicOrder = async (req, res) => {
  try {
    const { orderNumber, phone, slug } = req.query;
    if (!orderNumber || !phone) {
      return res.status(400).json({ success: false, message: 'Order number and customer phone are required' });
    }

    const phoneVariants = phoneLookupVariants(phone);

    // Reject empty/invalid input. Never fall back to a substring regex: that
    // can match a different customer whose number ends with the same digits.
    if (!phoneVariants.length) {
      return res.status(400).json({
        success: false,
        message: 'Please provide the 10-digit mobile number used at checkout',
      });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Order tracking is temporarily unavailable. Please try again.',
      });
    }

    const orderQuery = {
      orderNumber: String(orderNumber).trim(),
      customerPhone: { $in: phoneVariants },
    };

    // Order numbers are unique per tenant, not across the whole platform.
    // Scope by store slug when supplied, and refuse ambiguous matches otherwise.
    if (slug) {
      const tenant = await Tenant.findOne({ slug: String(slug).toLowerCase(), status: 'ACTIVE' }).select('_id');
      if (!tenant) {
        return res.status(404).json({ success: false, message: 'Storefront not found or inactive' });
      }
      orderQuery.businessId = tenant._id;
    }

    const matches = await Order.find(orderQuery)
      .limit(2)
      .select('orderNumber customerName orderStatus paymentStatus paymentMethod courierPartner trackingNumber items totalAmount createdAt timeline');

    if (matches.length === 0) {
      return res.status(404).json({ success: false, message: 'No matching order found for this number and phone' });
    }
    if (matches.length > 1) {
      return res.status(400).json({
        success: false,
        message: 'Multiple stores match this order number. Open the tracking link from your order confirmation.',
      });
    }

    res.json({ success: true, data: matches[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Capture public lead / inquiry from storefront (WhatsApp CTA or Exit-Intent Popup)
// @route   POST /api/public/store/:slug/inquire
// @access  Public
const createPublicInquiry = async (req, res) => {
  try {
    const { slug } = req.params;
    const {
      name,
      phone,
      productName,
      productPrice,
      productId,
      source = 'WHATSAPP',
      message,
      utmSource,
      utmMedium,
      utmCampaign,
      fbclid,
    } = req.body;

    if (!phone) {
      return res.status(400).json({ success: false, message: 'Phone number is required for inquiry' });
    }

    const cleanPhone = normalizeIndianPhone(phone);
    if (cleanPhone.length !== 10 || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid 10-digit mobile number' });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Inquiry service is temporarily unavailable. Please try again shortly.',
      });
    }

    const tenant = await Tenant.findOne({ slug: slug.toLowerCase(), status: 'ACTIVE' });
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Storefront not found or inactive',
      });
    }

    // Check if lead already exists with this phone
    let lead = await Lead.findOne({
      businessId: tenant._id,
      phone: { $in: phoneLookupVariants(cleanPhone) },
    });

    const inquiryNote = `Storefront inquiry from ${String(phone).trim()}${productName ? ` about ${productName}` : ''}${productPrice ? ` (₹${productPrice})` : ''} via ${source}.${message ? ` Message: ${message}` : ''}`;

    if (lead) {
      lead.notes.push({
        note: inquiryNote,
        authorName: 'Public Storefront',
        createdAt: new Date(),
      });
      if (productPrice && (!lead.budget || lead.budget < productPrice)) {
        lead.budget = productPrice;
      }
      if (name && (!lead.name || ['Storefront customer', 'Unnamed storefront inquiry'].includes(lead.name))) {
        lead.name = name;
      }
      await lead.save();
    } else {
      lead = await Lead.create({
        businessId: tenant._id,
        name: name || 'Unnamed storefront inquiry',
        phone: cleanPhone,
        source: source === 'EXIT_POPUP' ? 'WEBSITE' : ['WHATSAPP', 'WEBSITE', 'MANUAL', 'REFERRAL', 'OTHER'].includes(source) ? source : 'OTHER',
        campaignName: utmCampaign || '',
        utmSource: utmSource || '',
        utmMedium: utmMedium || '',
        utmCampaign: utmCampaign || '',
        fbclid: fbclid || '',
        status: 'NEW',
        budget: productPrice || 0,
        customFields: {
          productName: productName || '',
          productId: productId || '',
        },
        notes: [
          {
            note: inquiryNote,
            authorName: 'Public Storefront',
            createdAt: new Date(),
          },
        ],
      });
    }

    // Trigger automation rule asynchronously
    try {
      triggerAutomation({
        businessId: tenant._id,
        trigger: 'LEAD_INGESTED',
        entityType: 'LEAD',
        entityId: lead._id.toString(),
        data: {
          customerName: lead.name,
          customerPhone: lead.phone,
          source: lead.source,
          productName: productName || '',
          budget: lead.budget || productPrice || 0,
          menuUrl: buildAppUrl(req, `/store/${slug}`),
        },
      }).catch((e) => console.error('[Inquiry Automation Warning]:', e.message));
    } catch (autoErr) {
      console.error('[Inquiry Automation Error]:', autoErr.message);
    }

    // Build a WhatsApp URL only when the merchant has configured a contact number.
    const tenantPhone = String(tenant.contact?.phone || '').replace(/\D/g, '');
    let whatsappUrl = '';
    if (tenantPhone) {
      const cleanTenantPhone = tenantPhone.startsWith('91') ? tenantPhone : `91${tenantPhone.slice(-10)}`;
      const prefilledText = `Hi ${tenant.businessName}! I am inquiring about "${productName || 'your store'}"${productPrice ? ' (₹' + productPrice + ')' : ''}. Please share more details & COD options.`;
      whatsappUrl = `https://wa.me/${cleanTenantPhone}?text=${encodeURIComponent(prefilledText)}`;
    }

    res.status(200).json({
      success: true,
      message: 'Inquiry captured and logged to CRM successfully',
      data: {
        leadId: lead._id,
        whatsappUrl,
      },
    });
  } catch (error) {
    console.error('Error in createPublicInquiry:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error capturing inquiry' });
  }
};

module.exports = {
  getPublicStore,
  getPublicProduct,
  createPublicOrder,
  trackPublicOrder,
  createPublicInquiry,
};
