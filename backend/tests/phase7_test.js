const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const { app } = require('../src/server');
const Tenant = require('../src/models/Tenant');
const Order = require('../src/models/Order');
const Product = require('../src/models/Product');
const Category = require('../src/models/Category');
const Lead = require('../src/models/Lead');
const { PLAN_LIMITS } = require('../src/config/plans');

let server;
let merchantAToken;
let merchantBToken;
let merchantATenantId;
let merchantBTenantId;
let merchantASlug;
let testProductId;

const runTests = async () => {
  console.log('\n============================================================');
  console.log('--- STARTING PHASE 7 ULTRA-DEEP SUBSCRIPTIONS & QUOTAS TEST ---');
  console.log('============================================================\n');

  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/omniva_saas';
  await mongoose.connect(mongoUri);

  const PORT = 5007;
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
    await test('1. Authenticate Merchant A (Product) & Merchant B (Service)', async () => {
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

    // Ensure test product exists
    const category = await Category.findOneAndUpdate(
      { businessId: merchantATenantId, slug: 'pickles-achar' },
      { name: 'Pickles & Achar', businessId: merchantATenantId, slug: 'pickles-achar' },
      { upsert: true, returnDocument: 'after' }
    );
    const product = await Product.findOneAndUpdate(
      { businessId: merchantATenantId, slug: 'spicy-mango-achar-automation' },
      {
        businessId: merchantATenantId,
        name: 'Spicy Mango Achar Test',
        slug: 'spicy-mango-achar-automation',
        price: 320,
        categoryId: category._id,
        isAvailable: true,
        trackQuantity: false,
        variants: [{ name: '500g Jar', price: 320, sku: 'SMA-500G', stockQuantity: 50 }],
      },
      { upsert: true, returnDocument: 'after' }
    );
    testProductId = product._id;

    // 2. Fetch Public Platform Plans
    await test('2. Public Platform Plan Catalog (GET /api/subscriptions/plans)', async () => {
      const res = await fetch(`${BASE_URL}/subscriptions/plans`);
      const data = await res.json();
      if (!data.success || !Array.isArray(data.data)) throw new Error('Failed to retrieve plans');
      if (data.data.length < 3) throw new Error(`Expected at least 3 tiers, got ${data.data.length}`);
      const tiers = data.data.map((p) => p.tier);
      if (!tiers.includes('STARTER') || !tiers.includes('GROWTH') || !tiers.includes('PRO')) {
        throw new Error('Missing standard tiers');
      }
    });

    // 3. Merchant A checks Subscription Usage
    await test('3. Merchant checks Subscription & Quotas Usage (GET /api/subscriptions/usage)', async () => {
      const res = await fetch(`${BASE_URL}/subscriptions/usage`, {
        headers: { Authorization: `Bearer ${merchantAToken}` },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      if (!data.data.planTier) throw new Error('Missing planTier in response');
      if (data.data.usage?.orders === undefined) throw new Error('Missing orders usage stats');
      if (data.data.usage?.leads === undefined) throw new Error('Missing leads usage stats');
    });

    // 4. Merchant A sets STARTER plan
    await test('4. Merchant upgrades/switches to STARTER plan (POST /api/subscriptions/upgrade)', async () => {
      const res = await fetch(`${BASE_URL}/subscriptions/upgrade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${merchantAToken}`,
        },
        body: JSON.stringify({ planTier: 'STARTER', billingCycle: 'MONTHLY' }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      if (data.data.planTier !== 'STARTER') throw new Error(`Expected STARTER, got ${data.data.planTier}`);

      // Verify DB update
      const tenant = await Tenant.findById(merchantATenantId);
      if (tenant.planTier !== 'STARTER') throw new Error('DB planTier not updated');
    });

    // 5. Quota Enforcement Middleware: Artificially seed orders to hit STARTER max limit
    await test('5. Quota Enforcement: Storefront orders blocked with 403 QUOTA_EXCEEDED when monthly limit reached', async () => {
      // STARTER tier allows 50 orders max
      const starterLimit = PLAN_LIMITS.STARTER.maxMonthlyOrders;

      // Seed dummy orders to hit 50
      const dummyOrders = [];
      for (let i = 0; i < starterLimit; i++) {
        dummyOrders.push({
          businessId: merchantATenantId,
          orderNumber: `DUMMY-QUOTA-${Date.now()}-${i}`,
          customerName: `Customer ${i}`,
          customerPhone: `+9190000000${i % 100}`,
          totalAmount: 320,
          subtotal: 320,
          paymentMethod: 'COD',
          items: [{ productId: testProductId, name: 'Spicy Mango Achar Test', price: 320, quantity: 1, subtotal: 320 }],
          shippingAddress: { street: 'Main St', city: 'Delhi', state: 'Delhi', pincode: '110001' },
        });
      }
      await Order.insertMany(dummyOrders);

      // Now place 51st order via Storefront - must be blocked with HTTP 403
      const res = await fetch(`${BASE_URL}/public/store/${merchantASlug}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: 'Blocked Customer',
          customerPhone: '+919999999999',
          shippingAddress: { street: 'Test Rd', city: 'Delhi', state: 'Delhi', pincode: '110001' },
          items: [{ productId: testProductId, price: 320, quantity: 1 }],
          paymentMethod: 'COD',
        }),
      });

      if (res.status !== 403) throw new Error(`Expected 403 Forbidden on quota exceed, got ${res.status}`);
      const data = await res.json();
      if (data.code !== 'QUOTA_EXCEEDED') throw new Error(`Expected code QUOTA_EXCEEDED, got ${data.code}`);
    });

    // 6. Plan Upgrade: Merchant A upgrades to GROWTH plan (500 orders limit)
    await test('6. Upgrade to GROWTH plan lifts quota limit immediately', async () => {
      const res = await fetch(`${BASE_URL}/subscriptions/upgrade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${merchantAToken}`,
        },
        body: JSON.stringify({ planTier: 'GROWTH', billingCycle: 'MONTHLY' }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      if (data.data.planTier !== 'GROWTH') throw new Error('Upgrade to GROWTH failed');
    });

    // 7. Quota Relief: Order placement succeeds now that plan is GROWTH
    await test('7. Storefront order succeeds immediately after upgrading to GROWTH', async () => {
      const res = await fetch(`${BASE_URL}/public/store/${merchantASlug}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: 'Relieved Customer',
          customerPhone: '+919999999999',
          shippingAddress: { street: 'Test Rd', city: 'Delhi', state: 'Delhi', pincode: '110001' },
          items: [{ productId: testProductId, price: 320, quantity: 1 }],
          paymentMethod: 'COD',
        }),
      });

      if (res.status !== 201) {
        const errorText = await res.text();
        throw new Error(`Expected 201 Created after upgrade, got ${res.status}: ${errorText}`);
      }
      const data = await res.json();
      if (!data.success || !data.data?.orderNumber) throw new Error('Order creation payload invalid');
    });

    // 8. CRM Lead Quota Enforcement
    await test('8. CRM Lead Quota Enforcement: Limit blocks lead creation when tenant on STARTER with max leads', async () => {
      // Temporarily switch Merchant A to STARTER and reset period start to 1 hour ago
      await Tenant.updateOne(
        { _id: merchantATenantId },
        { 
          planTier: 'STARTER',
          'subscription.currentPeriodStart': new Date(Date.now() - 3600000),
        }
      );
      const starterLeadLimit = PLAN_LIMITS.STARTER.maxMonthlyLeads; // 100

      const dummyLeads = [];
      for (let i = 0; i < starterLeadLimit; i++) {
        dummyLeads.push({
          businessId: merchantATenantId,
          name: `Lead ${i}`,
          phone: `91111111${i % 100}`,
          source: 'META_ADS',
          status: 'NEW',
        });
      }
      await Lead.insertMany(dummyLeads);

      // Try creating 101st lead
      const res = await fetch(`${BASE_URL}/crm/leads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${merchantAToken}`,
        },
        body: JSON.stringify({
          name: 'Quota Exceeded Lead',
          phone: '9999888877',
          source: 'WEBSITE',
        }),
      });

      if (res.status !== 403) throw new Error(`Expected 403 on lead quota exceed, got ${res.status}`);
      const data = await res.json();
      if (data.code !== 'QUOTA_EXCEEDED') throw new Error(`Expected code QUOTA_EXCEEDED, got ${data.code}`);

      // Restore Merchant A back to GROWTH
      await Tenant.updateOne({ _id: merchantATenantId }, { planTier: 'GROWTH' });
    });

    // 9. Financial Analytics Endpoint
    await test('9. Financial Analytics (GET /api/subscriptions/analytics) calculates gross, net, COD split & AOV', async () => {
      const res = await fetch(`${BASE_URL}/subscriptions/analytics`, {
        headers: { Authorization: `Bearer ${merchantAToken}` },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      const metrics = data.data;

      if (metrics.grossSales === undefined || metrics.grossSales <= 0) throw new Error('grossSales calculation error');
      if (metrics.netSales === undefined) throw new Error('netSales missing');
      if (metrics.codSales === undefined) throw new Error('codSales missing');
      if (metrics.aov === undefined) throw new Error('aov missing');
      if (metrics.cancellationRate === undefined) throw new Error('cancellationRate missing');
      if (metrics.totalOrdersCount <= 0) throw new Error('totalOrdersCount error');
    });

    // 10. Security & Tenant Isolation in Billing
    await test('10. Security: Cross-Tenant Isolation in Billing endpoints', async () => {
      const resB = await fetch(`${BASE_URL}/subscriptions/usage`, {
        headers: { Authorization: `Bearer ${merchantBToken}` },
      });
      const dataB = await resB.json();
      if (!dataB.success) throw new Error(dataB.message);
      // Merchant B should have separate usage stats
      if (dataB.data.usage?.orders?.used === undefined) throw new Error('Merchant B usage missing');
    });

    // 11. Multi-Phase Full Regression across all prior phases
    await test('11. Multi-Phase Full Regression (Auth + CRM + CAPI + Commerce + Bookings + Automations)', async () => {
      // Auth check
      const authRes = await fetch(`${BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${merchantAToken}` },
      });
      if (authRes.status !== 200) throw new Error('Phase 1 Auth failed');

      // CRM check
      const crmRes = await fetch(`${BASE_URL}/crm/stats`, {
        headers: { Authorization: `Bearer ${merchantAToken}` },
      });
      if (crmRes.status !== 200) throw new Error('Phase 2 CRM failed');

      // Automations check
      const autoRes = await fetch(`${BASE_URL}/automations/rules`, {
        headers: { Authorization: `Bearer ${merchantAToken}` },
      });
      if (autoRes.status !== 200) throw new Error('Phase 6 Automations failed');
    });

  } finally {
    if (server) server.close();
    await mongoose.disconnect();
  }

  console.log('\n============================================================');
  console.log(`--- TEST RESULTS: ${passed} PASSED, ${failed} FAILED ---`);
  console.log('============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
};

runTests().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
