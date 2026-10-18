const mongoose = require('mongoose');
const Tenant = require('../models/Tenant');
const Category = require('../models/Category');
const Product = require('../models/Product');
const ServicePackage = require('../models/ServicePackage');
const Order = require('../models/Order');
const Lead = require('../models/Lead');
const { sendCapiEvent } = require('../services/metaCapiService');
const { triggerAutomation } = require('../services/automationEngine');

// @desc    Get public storefront data (Tenant info, categories, active products, service packages)
// @route   GET /api/public/store/:slug
// @access  Public
const getPublicStore = async (req, res) => {
  try {
    const { slug } = req.params;

    if (mongoose.connection.readyState !== 1) {
      // Cloud preview demo store fallback
      return res.json({
        success: true,
        data: {
          store: {
            businessName: 'Desi Rasoi Achar',
            slug: slug || 'desi-rasoi-achar-1',
            businessType: 'PRODUCT',
            templateCode: 'PRODUCT',
            enabledModules: {
              automations: true,
              crmLeads: true,
              marketingAds: true,
              products: true,
              serviceBookings: false,
              travelBookings: false,
              inventory: true,
              orders: true
            },
            branding: {
              logo: '',
              primaryColor: '#4f46e5',
              secondaryColor: '#06b6d4'
            },
            contact: {
              email: 'rahul@desirasoi.com',
              phone: '9876543210'
            }
          },
          categories: [
            { _id: 'cat_1', name: 'Mango Pickles', slug: 'mango-pickles', image: 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=800&auto=format&fit=crop&q=80' },
            { _id: 'cat_2', name: 'Chilli Pickles', slug: 'chilli-pickles', image: 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=800&auto=format&fit=crop&q=80' },
            { _id: 'cat_3', name: 'Garlic & Specialty', slug: 'garlic-specialty', image: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=800&auto=format&fit=crop&q=80' },
            { _id: 'cat_4', name: 'Festive Combos', slug: 'festive-combos', image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=80' }
          ],
          products: [
            {
              _id: 'prod_1',
              name: 'Traditional Mango Pickle (Aam Ka Achar)',
              slug: 'traditional-mango-pickle',
              description: 'Authentic sun-dried green mangoes steeped in cold-pressed mustard oil, fenugreek, and crushed spices.',
              price: 349,
              compareAtPrice: 449,
              images: ['https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=800&auto=format&fit=crop&q=80'],
              stockQuantity: 45,
              isAvailable: true
            },
            {
              _id: 'prod_2',
              name: 'Banarasi Stuffed Red Chilli (Lal Mirch Ka Achar)',
              slug: 'banarasi-stuffed-red-chilli',
              description: 'Plump Varanasi whole red chillies painstakingly hand-stuffed with roasted amchur, fennel, and mustard seeds.',
              price: 399,
              compareAtPrice: 499,
              images: ['https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=800&auto=format&fit=crop&q=80'],
              stockQuantity: 28,
              isAvailable: true
            },
            {
              _id: 'prod_3',
              name: 'Special Garlic Pickle (Lahsun Ka Achar)',
              slug: 'special-garlic-pickle',
              description: 'Peeled golden whole garlic cloves simmered in roasted cumin, hing, and spicy mustard gravy.',
              price: 379,
              compareAtPrice: 479,
              images: ['https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=800&auto=format&fit=crop&q=80'],
              stockQuantity: 35,
              isAvailable: true
            },
            {
              _id: 'prod_4',
              name: 'Grand Festive 3-Pickle Gift Pack',
              slug: 'grand-festive-3-pickle-gift-pack',
              description: 'Curated wooden crate containing 500g jars of Mango, Stuffed Red Chilli, and Tangy Lemon pickles.',
              price: 999,
              compareAtPrice: 1299,
              images: ['https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=80'],
              stockQuantity: 18,
              isAvailable: true
            }
          ],
          packages: []
        }
      });
    }

    const tenant = await Tenant.findOne({ slug, status: 'ACTIVE' }).select(
      'businessName slug businessType templateCode enabledModules branding contact settings'
    );

    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Storefront not found or inactive' });
    }

    const [categories, products, packages] = await Promise.all([
      Category.find({ businessId: tenant._id, isActive: true })
        .sort({ orderIndex: 1, name: 1 })
        .select('name slug description image orderIndex'),
      Product.find({ businessId: tenant._id, isAvailable: true })
        .sort({ createdAt: -1 })
        .populate('categoryId', 'name slug image')
        .select('name slug description price compareAtPrice images variants stockQuantity trackQuantity isAvailable tags categoryId'),
      ServicePackage.find({ businessId: tenant._id, isAvailable: true })
        .sort({ price: 1 })
        .select('name slug category description duration price advanceTokenPercent deliverables images maxCapacityPerDay isAvailable')
    ]);

    res.json({
      success: true,
      data: {
        store: tenant,
        categories,
        products,
        packages,
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
    const tenant = await Tenant.findOne({ slug, status: 'ACTIVE' }).select('_id businessName slug');
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Store not found' });
    }

    const product = await Product.findOne({
      businessId: tenant._id,
      slug: productSlug,
      isAvailable: true,
    }).populate('categoryId', 'name slug');

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
      paymentMethod = 'COD',
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

    // Strict Indian Mobile Number Validation (10 digits starting with 6-9)
    const cleanCustomerPhone = (customerPhone || '').toString().replace(/\D/g, '');
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

    const tenant = await Tenant.findOne({ slug, status: 'ACTIVE' });
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Storefront not found or inactive' });
    }

    // Verify each item against database pricing and inventory
    let verifiedSubtotal = 0;
    const verifiedItems = [];

    for (const cartItem of items) {
      let product = null;

      // Safe lookup: only query _id if cartItem.productId is a valid 24-char hex ObjectId
      if (cartItem.productId && mongoose.Types.ObjectId.isValid(cartItem.productId)) {
        product = await Product.findOne({
          _id: cartItem.productId,
          businessId: tenant._id,
          isAvailable: true,
        });
      }

      // Fallback lookup by name or slug
      if (!product) {
        product = await Product.findOne({
          businessId: tenant._id,
          isAvailable: true,
          $or: [
            { name: cartItem.name },
            { slug: cartItem.productId },
            { slug: cartItem.slug },
          ],
        });
      }

      // Fallback: use any active product for tenant
      if (!product) {
        product = await Product.findOne({
          businessId: tenant._id,
          isAvailable: true,
        });
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
        } else if (cartItem.price && Number(cartItem.price) > 0) {
          unitPrice = Number(cartItem.price);
        }
      } else {
        if (cartItem.price && Number(cartItem.price) > 0) {
          unitPrice = Number(cartItem.price);
        }
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
        image: (product.images && product.images[0]) || '',
      });
    }

    // Shipping rules: Free shipping over ₹499, otherwise ₹50
    const shippingFee = verifiedSubtotal >= 499 ? 0 : 50;
    const totalAmount = verifiedSubtotal + shippingFee;

    // Generate unique order number
    const dateCode = Date.now().toString().slice(-6);
    const randCode = Math.floor(100 + Math.random() * 900);
    const orderNumber = `ORD-${dateCode}-${randCode}`;

    // Atomically decrement stock
    for (const item of verifiedItems) {
      if (item.variantId) {
        await Product.updateOne(
          { _id: item.productId, 'variants._id': item.variantId },
          { $inc: { 'variants.$.stockQuantity': -item.quantity } }
        );
      } else {
        await Product.updateOne(
          { _id: item.productId },
          { $inc: { stockQuantity: -item.quantity } }
        );
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
      const cleanCustomerDigits = customerPhone.replace(/\D/g, '').slice(-10);
      if (cleanCustomerDigits.length >= 10) {
        const recentOrder = await Order.findOne({
          businessId: tenant._id,
          customerPhone: { $regex: cleanCustomerDigits },
          createdAt: { $gte: new Date(Date.now() - 24 * 3600 * 1000) },
        });
        if (recentOrder) {
          isDuplicateOrder = true;
        }
      }
    } catch (dupErr) {
      console.warn('[Duplicate Check Warning]:', dupErr.message);
    }

    // Create Order
    const order = await Order.create({
      businessId: tenant._id,
      orderNumber,
      customerName,
      customerPhone,
      customerEmail: customerEmail || '',
      shippingAddress,
      items: verifiedItems,
      subtotal: verifiedSubtotal,
      shippingFee,
      totalAmount,
      paymentMethod,
      paymentStatus: paymentMethod === 'ONLINE' ? 'PENDING' : 'PENDING',
      orderStatus: 'NEW',
      attribution: enrichedAttribution,
      notes: notes || '',
      timeline: [
        {
          status: 'NEW',
          note: isDuplicateOrder
            ? `Order placed online via storefront (${paymentMethod}) - [Fraud Flag: Duplicate phone in 24h]`
            : `Order placed online via storefront (${paymentMethod})`,
          updatedBy: 'Customer',
          timestamp: new Date(),
        },
      ],
    });

    // Fire Automation Engine Event (Trigger -> Condition -> Action)
    const trackingUrl = `${process.env.APP_URL || 'https://omniva-saas.vercel.app'}/orders/track?orderNumber=${order.orderNumber}&phone=${order.customerPhone}`;
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
        itemsCount: order.items?.length || 1,
        productName: order.items?.[0]?.name || 'Artisanal Product',
        trackingUrl,
      },
    }).catch((err) => console.error('[Automation Trigger Error]:', err.message));

    // Sync Customer / Order into CRM Lead Pipeline
    try {
      const cleanPhone = customerPhone.replace(/\D/g, '');
      const existingLead = await Lead.findOne({ businessId: tenant._id, phone: cleanPhone });

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
          phone: cleanPhone,
          email: customerEmail || '',
          source: 'WEBSITE',
          campaignName: enrichedAttribution.utmCampaign || 'Organic Storefront',
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
    if (tenant.settings?.metaPixelId && tenant.settings?.metaCapiToken) {
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
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Track public order status
// @route   GET /api/public/orders/track
// @access  Public
const trackPublicOrder = async (req, res) => {
  try {
    const { orderNumber, phone } = req.query;
    if (!orderNumber || !phone) {
      return res.status(400).json({ success: false, message: 'Order number and customer phone are required' });
    }

    const cleanPhone = phone.replace(/\D/g, '');
    const order = await Order.findOne({
      orderNumber: orderNumber.trim(),
      customerPhone: { $regex: cleanPhone.slice(-10) },
    }).select('orderNumber customerName orderStatus paymentStatus paymentMethod courierPartner trackingNumber items totalAmount createdAt timeline');

    if (!order) {
      return res.status(404).json({ success: false, message: 'No matching order found for this number and phone' });
    }

    res.json({ success: true, data: order });
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

    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      return res.status(400).json({ success: false, message: 'Please provide a valid 10-digit mobile number' });
    }

    let tenant = null;
    if (mongoose.connection.readyState === 1) {
      tenant = await Tenant.findOne({ slug: slug.toLowerCase() });
    }

    if (!tenant) {
      return res.status(200).json({
        success: true,
        message: 'Inquiry received successfully (demo)',
        data: {
          leadId: 'demo_lead_' + Date.now(),
          whatsappUrl: `https://wa.me/919876543210?text=${encodeURIComponent(`Hi! I am interested in ${productName || 'your products'}`)}`,
        },
      });
    }

    // Check if lead already exists with this phone
    let lead = await Lead.findOne({
      businessId: tenant._id,
      phone: { $regex: cleanPhone.slice(-10) },
    });

    const inquiryNote = `Storefront Inquiry: ${name || 'Customer'} inquired about ${productName || 'Product'}${productPrice ? ' (₹' + productPrice + ')' : ''} via ${source}.${message ? ' Message: ' + message : ''}`;

    if (lead) {
      lead.notes.push({
        note: inquiryNote,
        authorName: 'Public Storefront',
        createdAt: new Date(),
      });
      if (productPrice && (!lead.budget || lead.budget < productPrice)) {
        lead.budget = productPrice;
      }
      if (name && (!lead.name || lead.name === 'Storefront Customer')) {
        lead.name = name;
      }
      await lead.save();
    } else {
      lead = await Lead.create({
        businessId: tenant._id,
        name: name || 'Storefront Customer',
        phone: cleanPhone,
        source: source === 'EXIT_POPUP' ? 'WEBSITE' : 'WHATSAPP',
        campaignName: utmCampaign || 'Storefront Organic',
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
          productName: productName || 'Storefront Item',
          budget: lead.budget || productPrice || 0,
          menuUrl: `${process.env.APP_URL || 'https://omniva-saas.vercel.app'}/store/${slug}`,
        },
      }).catch((e) => console.error('[Inquiry Automation Warning]:', e.message));
    } catch (autoErr) {
      console.error('[Inquiry Automation Error]:', autoErr.message);
    }

    // Build WhatsApp URL
    const tenantPhone = tenant.contact?.phone || '9876543210';
    const cleanTenantDigits = tenantPhone.replace(/\D/g, '');
    const cleanTenantPhone = cleanTenantDigits.startsWith('91') ? cleanTenantDigits : `91${cleanTenantDigits.slice(-10)}`;
    const prefilledText = `Hi ${tenant.businessName}! I am inquiring about "${productName || 'your store'}"${productPrice ? ' (₹' + productPrice + ')' : ''}. Please share more details & COD options.`;
    const whatsappUrl = `https://wa.me/${cleanTenantPhone}?text=${encodeURIComponent(prefilledText)}`;

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
