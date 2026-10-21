const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const { app } = require('../src/server');
const Tenant = require('../src/models/Tenant');
const User = require('../src/models/User');
const Product = require('../src/models/Product');
const Category = require('../src/models/Category');
const Order = require('../src/models/Order');
const Lead = require('../src/models/Lead');

let server;
let merchantAToken;
let merchantBToken;
let merchantATenantId;
let merchantBTenantId;
let categoryAId;
let productA1Id;
let productA2Id;
let variant500gId;
let createdOrderNumber;
let createdOrderId;
let merchantASlug;

const runTests = async () => {
  console.log('\n============================================================');
  console.log('--- STARTING PHASE 4 ULTRA-DEEP COMMERCE & STOREFRONT TEST ---');
  console.log('============================================================\n');

  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/omniva_saas';
  await mongoose.connect(mongoUri);

  const PORT = 5004;
  await new Promise((resolve) => {
    server = app.listen(PORT, resolve);
  });
  const BASE_URL = `http://127.0.0.1:${PORT}/api`;

  let passed = 0;
  let failed = 0;

  const test = async (name, fn) => {
    try {
      await fn();
      console.log(`  [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  [FAIL] ${name}`);
      console.error(`         Error: ${err.message}`);
      failed++;
    }
  };

  try {
    // 1. Authenticate Merchants
    await test('1. Authenticate Merchant A (Achar Store) and Merchant B (Studios)', async () => {
      const resA = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'rahul@desirasoi.com', password: 'password123' }),
      });
      const dataA = await resA.json();
      if (!dataA.success || !dataA.token) throw new Error('Merchant A login failed');
      merchantAToken = dataA.token;
      merchantATenantId = dataA.tenant.id;
      merchantASlug = dataA.tenant.slug;

      const resB = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'vikram@royalfilms.com', password: 'password123' }),
      });
      const dataB = await resB.json();
      if (!dataB.success || !dataB.token) throw new Error('Merchant B login failed');
      merchantBToken = dataB.token;
      merchantBTenantId = dataB.tenant.id;
    });

    // Clean previous commerce data for test isolation
    await Category.deleteMany({ businessId: { $in: [merchantATenantId, merchantBTenantId] } });
    await Product.deleteMany({ businessId: { $in: [merchantATenantId, merchantBTenantId] } });
    await Order.deleteMany({ businessId: { $in: [merchantATenantId, merchantBTenantId] } });
    await Lead.deleteMany({ businessId: merchantATenantId, phone: '9876543210' });

    // 2. Category Creation & Isolation
    await test('2. Create Category for Merchant A and verify Merchant B isolation', async () => {
      const res = await fetch(`${BASE_URL}/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${merchantAToken}`,
        },
        body: JSON.stringify({
          name: 'Traditional Pickles',
          description: 'Authentic homemade sun-dried pickles',
        }),
      });
      const data = await res.json();
      if (!data.success || !data.data._id) throw new Error(`Category create failed: ${data.message}`);
      categoryAId = data.data._id;

      // Verify Merchant B cannot see Merchant A's category
      const resB = await fetch(`${BASE_URL}/categories`, {
        headers: { Authorization: `Bearer ${merchantBToken}` },
      });
      if (resB.status === 200) {
        const dataB = await resB.json();
        if (dataB.data?.some((c) => c._id === categoryAId)) {
          throw new Error('Tenant Leakage! Merchant B can see Merchant A category');
        }
      } else if (resB.status !== 403) {
        throw new Error(`Expected status 200 or 403, got ${resB.status}`);
      }
    });

    // 3. Product Catalog Creation with Variants & Stock
    await test('3. Create Products with Variants and Inventory', async () => {
      // Product 1: Mango Pickle with 2 variants
      const res1 = await fetch(`${BASE_URL}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${merchantAToken}`,
        },
        body: JSON.stringify({
          name: 'Spicy Mango Pickle (Aam ka Achar)',
          categoryId: categoryAId,
          description: 'Spiced with pure mustard oil and fenugreek',
          price: 299,
          compareAtPrice: 399,
          stockQuantity: 80,
          variants: [
            { name: '500g Jar', price: 299, compareAtPrice: 399, stockQuantity: 50 },
            { name: '1kg Jar', price: 499, compareAtPrice: 649, stockQuantity: 30 },
          ],
          tags: ['achar', 'mango', 'bestseller'],
        }),
      });
      const data1 = await res1.json();
      if (!data1.success || !data1.data._id) throw new Error(`Product 1 create failed: ${data1.message}`);
      productA1Id = data1.data._id;
      variant500gId = data1.data.variants[0]._id;

      // Product 2: Red Chilli Pickle without variants
      const res2 = await fetch(`${BASE_URL}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${merchantAToken}`,
        },
        body: JSON.stringify({
          name: 'Banarasi Lal Mirch Achar',
          categoryId: categoryAId,
          description: 'Hand-stuffed red chilli pickle with amchur',
          price: 349,
          compareAtPrice: 450,
          stockQuantity: 40,
          tags: ['achar', 'chilli'],
        }),
      });
      const data2 = await res2.json();
      if (!data2.success || !data2.data._id) throw new Error(`Product 2 create failed: ${data2.message}`);
      productA2Id = data2.data._id;

      // Check merchant A product count
      const resListA = await fetch(`${BASE_URL}/products`, {
        headers: { Authorization: `Bearer ${merchantAToken}` },
      });
      const dataListA = await resListA.json();
      if (dataListA.count !== 2) throw new Error(`Expected 2 products, found ${dataListA.count}`);

      // Check Merchant B has 0 products or is module-gated (403)
      const resListB = await fetch(`${BASE_URL}/products`, {
        headers: { Authorization: `Bearer ${merchantBToken}` },
      });
      if (resListB.status === 403) {
        // Expected: products module disabled for SERVICE merchant
      } else {
        const dataListB = await resListB.json();
        if (dataListB.count !== 0) throw new Error(`Tenant leak: Merchant B has ${dataListB.count} products`);
      }
    });

    // 4. Public Storefront Discovery
    await test('4. Public Storefront Discovery (No Auth Required)', async () => {
      const res = await fetch(`${BASE_URL}/public/store/${merchantASlug}`);
      const data = await res.json();
      if (!data.success) throw new Error(`Storefront fetch failed: ${data.message}`);
      if (data.data.store.businessName !== 'Desi Rasoi Achar') {
        throw new Error(`Store name mismatch: ${data.data.store.businessName}`);
      }
      if (data.data.categories.length !== 1) throw new Error('Expected 1 category');
      if (data.data.products.length !== 2) throw new Error('Expected 2 products in storefront');

      // 404 test on invalid slug
      const resInvalid = await fetch(`${BASE_URL}/public/store/unknown-shop-123xyz`);
      if (resInvalid.status !== 404) throw new Error(`Expected 404 for invalid shop, got ${resInvalid.status}`);
    });

    // 5. Public Order Placement (COD) & Stock Deduction
    await test('5. Public Order Placement (COD) with real-time Stock Deduction', async () => {
      const orderPayload = {
        customerName: 'Aarav Sharma',
        customerPhone: '+919876543210',
        customerEmail: 'aarav.sharma@gmail.com',
        shippingAddress: {
          street: 'Flat 402, Sunshine Apartments, Sector 62',
          city: 'Noida',
          state: 'Uttar Pradesh',
          pincode: '201309',
        },
        items: [
          {
            productId: productA1Id,
            variantId: variant500gId,
            quantity: 2, // 299 * 2 = 598
          },
          {
            productId: productA2Id,
            quantity: 1, // 349 * 1 = 349
          },
        ],
        paymentMethod: 'COD',
        attribution: {
          utmSource: 'facebook',
          utmMedium: 'cpc',
          utmCampaign: 'aam_achar_diwali_sale',
          fbclid: 'IwAR0123456789abcdef',
        },
        notes: 'Please ring bell twice',
      };

      const res = await fetch(`${BASE_URL}/public/store/${merchantASlug}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      });

      const data = await res.json();
      if (!data.success || !data.data.orderNumber) {
        throw new Error(`Order placement failed: ${data.message}`);
      }

      createdOrderNumber = data.data.orderNumber;
      createdOrderId = data.data.orderId;
      // 598 + 349 = 947, free shipping threshold (>= 499)
      if (data.data.totalAmount !== 947) {
        throw new Error(`Expected total ₹947, got ₹${data.data.totalAmount}`);
      }
      if (data.data.shippingFee !== 0) {
        throw new Error(`Expected ₹0 shipping fee for order > ₹499, got ₹${data.data.shippingFee}`);
      }

      // Verify stock was atomically deducted
      const product1 = await Product.findById(productA1Id);
      const variant500 = product1.variants.id(variant500gId);
      if (variant500.stockQuantity !== 48) {
        throw new Error(`Variant stock should be 48 (50 - 2), got ${variant500.stockQuantity}`);
      }

      const product2 = await Product.findById(productA2Id);
      if (product2.stockQuantity !== 39) {
        throw new Error(`Product 2 stock should be 39 (40 - 1), got ${product2.stockQuantity}`);
      }
    });

    // 5b. ONLINE checkout is rejected until real payment initiation exists.
    await test('5b. Reject ONLINE payment with an explicit COD-only message', async () => {
      const res = await fetch(`${BASE_URL}/public/store/${merchantASlug}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: 'Online Buyer',
          customerPhone: '+919999999999',
          shippingAddress: { street: 'Test Rd', city: 'Delhi', state: 'Delhi', pincode: '110001' },
          items: [{ productId: productA2Id, quantity: 1 }],
          paymentMethod: 'ONLINE',
        }),
      });
      const data = await res.json();
      if (res.status !== 400 || !/online payment is currently unavailable/i.test(data.message || '')) {
        throw new Error(`Expected ONLINE checkout to be rejected, got ${res.status}: ${data.message}`);
      }
    });

    // 6. Insufficient Stock Validation
    await test('6. Reject Order when Stock is Insufficient', async () => {
      const orderPayload = {
        customerName: 'Greedy Buyer',
        customerPhone: '9999988888',
        shippingAddress: {
          street: '123 Bulk Road',
          city: 'Delhi',
          pincode: '110001',
        },
        items: [
          {
            productId: productA2Id,
            quantity: 999, // Stock is only 39!
          },
        ],
        paymentMethod: 'COD',
      };

      const res = await fetch(`${BASE_URL}/public/store/${merchantASlug}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      });

      const data = await res.json();
      if (res.status !== 400 || !data.message.includes('Insufficient stock')) {
        throw new Error(`Expected 400 Insufficient stock, got status ${res.status}: ${data.message}`);
      }
    });

    // 7. Automatic CRM Lead Sync from Commerce Order
    await test('7. Verify Automatic CRM Lead Creation & Attribution Sync', async () => {
      const storedOrder = await Order.findById(createdOrderId);
      if (storedOrder.customerPhone !== '9876543210') {
        throw new Error(`Expected normalized order phone, got ${storedOrder.customerPhone}`);
      }
      const lead = await Lead.findOne({ businessId: merchantATenantId, phone: '9876543210' });
      if (!lead) throw new Error('Lead was not automatically created in CRM for order customer');
      if (lead.status !== 'WON') throw new Error(`Expected status WON, got ${lead.status}`);
      if (lead.campaignName !== 'aam_achar_diwali_sale') {
        throw new Error(`Expected campaign attribution preserved, got ${lead.campaignName}`);
      }
    });

    // 8. Merchant Order Management & Status Lifecycle
    await test('8. Merchant Order Administration & Status Transitions', async () => {
      // Fetch orders list
      const res = await fetch(`${BASE_URL}/orders`, {
        headers: { Authorization: `Bearer ${merchantAToken}` },
      });
      const data = await res.json();
      if (!data.success || data.count !== 1) {
        throw new Error(`Expected 1 order in merchant list, got ${data.count}`);
      }
      if (data.data[0].orderNumber !== createdOrderNumber) {
        throw new Error(`Order number mismatch: ${data.data[0].orderNumber}`);
      }

      // Update Order Status to CONFIRMED
      const resUpdate = await fetch(`${BASE_URL}/orders/${createdOrderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${merchantAToken}`,
        },
        body: JSON.stringify({
          orderStatus: 'CONFIRMED',
          note: 'Customer verified address via phone call',
        }),
      });
      const dataUpdate = await resUpdate.json();
      if (!dataUpdate.success || dataUpdate.data.orderStatus !== 'CONFIRMED') {
        throw new Error('Failed to update status to CONFIRMED');
      }

      // Update Order Status to SHIPPED with Tracking info
      const resShip = await fetch(`${BASE_URL}/orders/${createdOrderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${merchantAToken}`,
        },
        body: JSON.stringify({
          orderStatus: 'SHIPPED',
          courierPartner: 'Delhivery Surface',
          trackingNumber: 'DLV9912345678',
          note: 'Handed over to courier hub',
        }),
      });
      const dataShip = await resShip.json();
      if (dataShip.data.orderStatus !== 'SHIPPED' || dataShip.data.trackingNumber !== 'DLV9912345678') {
        throw new Error('Failed to ship order with tracking details');
      }
      if (dataShip.data.timeline.length < 3) {
        throw new Error(`Expected at least 3 timeline events, got ${dataShip.data.timeline.length}`);
      }
    });

    // 9. Merchant Order Stats / Analytics
    await test('9. Merchant Commerce Metrics and Revenue Analytics', async () => {
      const res = await fetch(`${BASE_URL}/orders/stats`, {
        headers: { Authorization: `Bearer ${merchantAToken}` },
      });
      const data = await res.json();
      if (!data.success) throw new Error('Failed to fetch order stats');
      if (data.data.totalOrders !== 1) throw new Error(`Expected 1 totalOrder, got ${data.data.totalOrders}`);
      if (data.data.revenue.totalRevenue !== 947) {
        throw new Error(`Expected revenue ₹947, got ₹${data.data.revenue.totalRevenue}`);
      }
      if (data.data.statusCounts.SHIPPED !== 1) {
        throw new Error(`Expected statusCounts.SHIPPED = 1, got ${data.data.statusCounts.SHIPPED}`);
      }
    });

    // 10. Cross-Tenant IDOR Attack Rejection
    await test('10. Security: Cross-Tenant Order IDOR Protection (Merchant B -> Merchant A order)', async () => {
      // Merchant B attempts to fetch Merchant A's order
      const resGet = await fetch(`${BASE_URL}/orders/${createdOrderId}`, {
        headers: { Authorization: `Bearer ${merchantBToken}` },
      });
      if (resGet.status !== 404 && resGet.status !== 403) {
        throw new Error(`IDOR Leak! Merchant B fetched Merchant A's order with status ${resGet.status}`);
      }

      // Merchant B attempts to tamper with Merchant A's order status
      const resPatch = await fetch(`${BASE_URL}/orders/${createdOrderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${merchantBToken}`,
        },
        body: JSON.stringify({ orderStatus: 'CANCELLED' }),
      });
      if (resPatch.status !== 404 && resPatch.status !== 403) {
        throw new Error(`IDOR Tamper Leak! Merchant B altered Merchant A's order with status ${resPatch.status}`);
      }
    });

    // 11. Public Real-Time Order Tracking
    await test('11. Public Order Tracking via Order Number + Customer Phone', async () => {
      const res = await fetch(
        `${BASE_URL}/public/orders/track?orderNumber=${createdOrderNumber}&phone=9876543210`
      );
      const data = await res.json();
      if (!data.success) throw new Error(`Tracking lookup failed: ${data.message}`);
      if (data.data.orderStatus !== 'SHIPPED') {
        throw new Error(`Expected tracked status SHIPPED, got ${data.data.orderStatus}`);
      }
      if (data.data.courierPartner !== 'Delhivery Surface') {
        throw new Error(`Expected courier 'Delhivery Surface', got ${data.data.courierPartner}`);
      }
      if (data.data.timeline.length < 3) {
        throw new Error('Timeline is missing progression events');
      }

      // Negative check: wrong phone fails
      const resWrong = await fetch(
        `${BASE_URL}/public/orders/track?orderNumber=${createdOrderNumber}&phone=9111111111`
      );
      if (resWrong.status !== 404) {
        throw new Error(`Expected 404 for wrong phone lookup, got ${resWrong.status}`);
      }
    });

    // 12. Full Multi-Phase Regression: Phase 1 (Auth), Phase 2 (CRM), Phase 3 (Meta CAPI)
    await test('12. Full Multi-Phase Regression (Auth + CRM Pipeline + Meta CAPI)', async () => {
      // Phase 1 regression: Verify token authentication
      const meRes = await fetch(`${BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${merchantAToken}` },
      });
      const meData = await meRes.json();
      if (!meData.success || meData.user.email !== 'rahul@desirasoi.com') {
        throw new Error('Phase 1 Auth regression failed');
      }

      // Phase 2 regression: Verify CRM stats
      const crmRes = await fetch(`${BASE_URL}/crm/stats`, {
        headers: { Authorization: `Bearer ${merchantAToken}` },
      });
      const crmData = await crmRes.json();
      if (!crmData.success || crmData.stats.totalLeads < 1) {
        throw new Error('Phase 2 CRM regression failed');
      }

      // Phase 3 regression: Verify Meta settings
      const metaRes = await fetch(`${BASE_URL}/meta/settings`, {
        headers: { Authorization: `Bearer ${merchantAToken}` },
      });
      const metaData = await metaRes.json();
      if (!metaData.success || !metaData.settings.webhookUrl) {
        throw new Error('Phase 3 Meta Settings regression failed');
      }
    });

  } finally {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await mongoose.connection.close();
  }

  console.log('\n============================================================');
  console.log(`--- TEST RESULTS: ${passed} PASSED, ${failed} FAILED ---`);
  console.log('============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
};

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
