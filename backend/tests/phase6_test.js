const mongoose = require('mongoose');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// Tests must never send real WhatsApp messages to fake phone numbers, even when
// the developer's environment contains live Cloud API credentials.
process.env.WHATSAPP_ACCESS_TOKEN = '';
process.env.WHATSAPP_PHONE_NUMBER_ID = '';

const { app } = require('../src/server');
const AutomationRule = require('../src/models/AutomationRule');
const AutomationLog = require('../src/models/AutomationLog');
const Order = require('../src/models/Order');
const Product = require('../src/models/Product');
const Category = require('../src/models/Category');

let server;
let merchantAToken;
let merchantBToken;
let merchantATenantId;
let merchantBTenantId;
let merchantASlug;
let merchantBSlug;

let ruleA1Id;
let ruleA2Id;
let ruleB1Id;
let testProductId;
let placedOrderNumber;

const runTests = async () => {
  console.log('\n============================================================');
  console.log('--- STARTING PHASE 6 ULTRA-DEEP AUTOMATIONS & WEBHOOKS TEST ---');
  console.log('============================================================\n');

  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/omniva_saas';
  await mongoose.connect(mongoUri);

  const PORT = 5006;
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
      merchantBSlug = dataB.tenant.slug;
    });

    // Clean test automation data
    await AutomationRule.deleteMany({ businessId: { $in: [merchantATenantId, merchantBTenantId] } });
    await AutomationLog.deleteMany({ businessId: { $in: [merchantATenantId, merchantBTenantId] } });

    // Seed a product for Merchant A if none exists
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

    // 2. Merchant A creates Rule 1 (Condition: totalAmount > 500)
    await test('2. Merchant A creates Automation Rule 1 (ORDER_CREATED -> WhatsApp when totalAmount > 500)', async () => {
      const res = await fetch(`${BASE_URL}/automations/rules`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${merchantAToken}`,
        },
        body: JSON.stringify({
          name: 'WhatsApp VIP Order Confirmation',
          trigger: 'ORDER_CREATED',
          condition: {
            field: 'totalAmount',
            operator: 'GREATER_THAN',
            value: '500',
          },
          action: {
            type: 'SEND_WHATSAPP',
            target: '{{customerPhone}}',
            template: 'Dear {{customerName}}, your VIP order {{orderNumber}} for ₹{{totalAmount}} is received!',
          },
        }),
      });
      const data = await res.json();
      if (!data.success || !data.data._id) throw new Error(data.message || 'Rule creation failed');
      ruleA1Id = data.data._id;
      if (data.data.name !== 'WhatsApp VIP Order Confirmation') throw new Error('Rule name mismatch');
    });

    // 3. Merchant A creates Rule 2 (Condition: ALWAYS)
    await test('3. Merchant A creates Automation Rule 2 (ORDER_CREATED -> OUTBOUND_WEBHOOK ALWAYS)', async () => {
      const res = await fetch(`${BASE_URL}/automations/rules`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${merchantAToken}`,
        },
        body: JSON.stringify({
          name: 'Sync Order to Logistics Webhook',
          trigger: 'ORDER_CREATED',
          condition: {
            field: 'always',
            operator: 'ALWAYS',
            value: '',
          },
          action: {
            type: 'OUTBOUND_WEBHOOK',
            target: '',
            template: 'Order {{orderNumber}} placed for ₹{{totalAmount}}',
          },
        }),
      });
      const data = await res.json();
      if (!data.success || !data.data._id) throw new Error(data.message || 'Rule 2 creation failed');
      ruleA2Id = data.data._id;
    });

    // 4. Merchant B creates Rule 1
    await test('4. Merchant B creates Automation Rule (BOOKING_CREATED -> SEND_WHATSAPP)', async () => {
      const res = await fetch(`${BASE_URL}/automations/rules`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${merchantBToken}`,
        },
        body: JSON.stringify({
          name: 'Photography Shoot Booking Alert',
          trigger: 'BOOKING_CREATED',
          condition: {
            field: 'always',
            operator: 'ALWAYS',
            value: '',
          },
          action: {
            type: 'SEND_WHATSAPP',
            target: '{{clientPhone}}',
            template: 'Thank you {{customerName}} for booking shoot #{{bookingNumber}}!',
          },
        }),
      });
      const data = await res.json();
      if (!data.success || !data.data._id) throw new Error(data.message || 'Rule B1 creation failed');
      ruleB1Id = data.data._id;
    });

    // 5. Cross-Tenant Isolation: Merchant B cannot see Merchant A's rules
    await test('5. Cross-Tenant Isolation: Merchant B cannot see Merchant A rules', async () => {
      const res = await fetch(`${BASE_URL}/automations/rules`, {
        headers: { Authorization: `Bearer ${merchantBToken}` },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      if (data.count !== 1) throw new Error(`Expected 1 rule for Merchant B, found ${data.count}`);
      if (data.data[0]._id !== ruleB1Id) throw new Error('Rule ID does not match Merchant B rule');
      const containsARule = data.data.some((r) => r._id === ruleA1Id || r._id === ruleA2Id);
      if (containsARule) throw new Error('Tenant data leak: Merchant A rule found in Merchant B response');
    });

    // 6. Cross-Tenant Security: Merchant B cannot update or delete Merchant A's rules (IDOR prevention)
    await test('6. Cross-Tenant Security: Merchant B cannot mutate or delete Merchant A rules (IDOR check)', async () => {
      // Try PUT
      const putRes = await fetch(`${BASE_URL}/automations/rules/${ruleA1Id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${merchantBToken}`,
        },
        body: JSON.stringify({ name: 'Hacked Rule Name' }),
      });
      if (putRes.status !== 404) throw new Error(`Expected 404 on cross-tenant PUT, got ${putRes.status}`);

      // Try DELETE
      const delRes = await fetch(`${BASE_URL}/automations/rules/${ruleA1Id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${merchantBToken}` },
      });
      if (delRes.status !== 404) throw new Error(`Expected 404 on cross-tenant DELETE, got ${delRes.status}`);

      // Verify Rule A1 is still intact
      const rule = await AutomationRule.findById(ruleA1Id);
      if (!rule || rule.name === 'Hacked Rule Name') throw new Error('Rule was modified despite IDOR protection');
    });

    // 7. Trigger Engine Execution via Storefront: Order under ₹500
    await test('7. Storefront Order placement logs skipped actions when no provider or webhook URL is configured', async () => {
      const res = await fetch(`${BASE_URL}/public/store/${merchantASlug}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: 'Kavita Roy',
          customerPhone: '+919988776655',
          shippingAddress: {
            street: '12 Green Park',
            city: 'New Delhi',
            state: 'Delhi',
            pincode: '110016',
          },
          items: [
            {
              productId: testProductId,
              title: 'Spicy Mango Achar Test',
              variantName: '500g Jar',
              price: 320,
              quantity: 1, // Total = ₹320 (Below ₹500 threshold)
            },
          ],
          paymentMethod: 'COD',
        }),
      });
      const data = await res.json();
      if (!data.success || !data.data?.orderNumber) throw new Error(data.message || 'Order placement failed');

      // Check Rule 1 (Condition > 500 should NOT execute)
      const rule1 = await AutomationRule.findById(ruleA1Id);
      if (rule1.executionCount !== 0) throw new Error(`Expected Rule 1 executionCount 0, got ${rule1.executionCount}`);

      // Check Rule 2 (Condition ALWAYS matches, but no webhook URL is configured)
      const rule2 = await AutomationRule.findById(ruleA2Id);
      if (rule2.executionCount !== 0) throw new Error(`Expected Rule 2 executionCount 0, got ${rule2.executionCount}`);

      // Check AutomationLog entry for Rule 2
      const log = await AutomationLog.findOne({
        businessId: merchantATenantId,
        ruleId: ruleA2Id,
      });
      if (!log) throw new Error('AutomationLog for Rule 2 not found');
      if (log.status !== 'SKIPPED') throw new Error(`Expected status SKIPPED, got ${log.status}`);
      if (!log.errorMessage.toLowerCase().includes('no outbound webhook url')) throw new Error('Missing skip reason for unconfigured webhook');
      if (!log.payloadSummary.includes('Order')) throw new Error('Payload summary not formatted properly');
    });

    // 8. Trigger Engine Execution via Storefront: Order over ₹500
    await test('8. Storefront Order placement with totalAmount > 500 records both actions without fake success', async () => {
      const res = await fetch(`${BASE_URL}/public/store/${merchantASlug}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: 'Rajesh Khanna',
          customerPhone: '+919876543210',
          shippingAddress: {
            street: '45 Marine Drive',
            city: 'Mumbai',
            state: 'Maharashtra',
            pincode: '400020',
          },
          items: [
            {
              productId: testProductId,
              title: 'Spicy Mango Achar Test',
              variantName: '500g Jar',
              price: 320,
              quantity: 2, // Total = ₹640 (Above ₹500 threshold)
            },
          ],
          paymentMethod: 'ONLINE',
        }),
      });
      const data = await res.json();
      if (!data.success || !data.data?.orderNumber) throw new Error(data.message || 'VIP Order placement failed');
      placedOrderNumber = data.data.orderNumber;

      // Both rules should have incremented
      const rule1 = await AutomationRule.findById(ruleA1Id);
      const rule2 = await AutomationRule.findById(ruleA2Id);

      if (rule1.executionCount !== 0) throw new Error(`Expected Rule 1 executionCount 0, got ${rule1.executionCount}`);
      if (rule2.executionCount !== 0) throw new Error(`Expected Rule 2 executionCount 0, got ${rule2.executionCount}`);

      // Check the WhatsApp action is recorded as skipped (no provider configured),
      // while still proving the template was interpolated correctly.
      const vipLog = await AutomationLog.findOne({
        businessId: merchantATenantId,
        ruleId: ruleA1Id,
      });
      if (!vipLog) throw new Error('VIP AutomationLog not found');
      if (vipLog.status === 'SUCCESS') throw new Error('WhatsApp action must not report SUCCESS without a real delivery');
      if (!['SKIPPED', 'FAILED'].includes(vipLog.status)) throw new Error(`Unexpected WhatsApp log status: ${vipLog.status}`);
      if (!vipLog.errorMessage) throw new Error('Missing WhatsApp failure/skip reason');
      if (!vipLog.payloadSummary.includes('Rajesh Khanna')) {
        throw new Error(`Token interpolation failed. Summary: ${vipLog.payloadSummary}`);
      }
    });

    // 9. Inbound Razorpay Webhook with Valid HMAC-SHA256 Signature
    await test('9. Inbound Razorpay Webhook with valid HMAC signature updates order to PAID & CONFIRMED', async () => {
      const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'omniva_rzp_secret_2026';

      const webhookBody = {
        event: 'order.paid',
        payload: {
          payment: {
            entity: {
              id: 'pay_test_987654321',
              order_id: 'order_rzp_test_101',
              amount: 64000,
              currency: 'INR',
              status: 'captured',
              notes: {
                orderNumber: placedOrderNumber,
              },
            },
          },
        },
      };

      const rawBody = JSON.stringify(webhookBody);
      const signature = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex');

      const res = await fetch(`${BASE_URL}/webhooks/razorpay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-razorpay-signature': signature,
        },
        body: rawBody,
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Webhook rejected');

      // Verify Order is updated
      const updatedOrder = await Order.findOne({ orderNumber: placedOrderNumber });
      if (!updatedOrder) throw new Error('Order not found');
      if (updatedOrder.paymentStatus !== 'PAID') throw new Error(`Expected paymentStatus PAID, got ${updatedOrder.paymentStatus}`);
      if (updatedOrder.orderStatus !== 'CONFIRMED') throw new Error(`Expected orderStatus CONFIRMED, got ${updatedOrder.orderStatus}`);
      if (updatedOrder.paymentDetails.razorpayPaymentId !== 'pay_test_987654321') {
        throw new Error('razorpayPaymentId not recorded on order');
      }
    });

    // 10. Inbound Razorpay Webhook with Invalid Signature rejected
    await test('10. Inbound Razorpay Webhook with invalid signature is rejected with 400 Bad Request', async () => {
      const fakeBody = JSON.stringify({ event: 'order.paid' });
      const badSignature = 'invalid_tampered_signature_12345';

      const res = await fetch(`${BASE_URL}/webhooks/razorpay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-razorpay-signature': badSignature,
        },
        body: fakeBody,
      });

      if (res.status !== 400) throw new Error(`Expected 400 Bad Request, got ${res.status}`);
      const data = await res.json();
      if (data.success !== false) throw new Error('Expected success: false for invalid signature');
    });

    // 11. Audit Logs Retrieval
    await test('11. Querying /api/automations/logs returns merchant audit trail with tenant isolation', async () => {
      const res = await fetch(`${BASE_URL}/automations/logs`, {
        headers: { Authorization: `Bearer ${merchantAToken}` },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      if (data.count < 2) throw new Error(`Expected at least 2 logs for Merchant A, got ${data.count}`);

      // Verify all logs belong to Merchant A
      const nonBelonging = data.data.some((l) => String(l.businessId) !== String(merchantATenantId));
      if (nonBelonging) throw new Error('Tenant isolation failure in logs');
    });

    // 12. Test Trigger Simulation Endpoint
    await test('12. POST /api/automations/test simulates dry trigger evaluation', async () => {
      const res = await fetch(`${BASE_URL}/automations/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${merchantAToken}`,
        },
        body: JSON.stringify({
          trigger: 'ORDER_CREATED',
          entityType: 'ORDER',
          entityId: 'TEST-SIM-001',
          payload: {
            orderNumber: 'TEST-SIM-001',
            customerName: 'Dry Run Tester',
            totalAmount: 1200,
          },
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      if (data.matchedRulesCount < 2) throw new Error(`Expected matchedRulesCount >= 2, got ${data.matchedRulesCount}`);
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
