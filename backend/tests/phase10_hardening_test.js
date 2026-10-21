process.env.NODE_ENV = 'test';
process.env.DISABLE_RATE_LIMIT = 'true';
process.env.RAZORPAY_WEBHOOK_SECRET = 'phase10-test-webhook-secret';
process.env.META_APP_SECRET = 'phase10-test-meta-app-secret';
process.env.META_WEBHOOK_VERIFY_TOKEN = 'phase10-test-meta-verify-token';

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const http = require('http');
const { once } = require('events');
const { execFile } = require('child_process');
const { promisify } = require('util');
const express = require('express');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const mongoose = require('mongoose');
const { app } = require('../src/server');
const Tenant = require('../src/models/Tenant');
const User = require('../src/models/User');
const Product = require('../src/models/Product');
const Order = require('../src/models/Order');
const Lead = require('../src/models/Lead');
const Coupon = require('../src/models/Coupon');
const ServicePackage = require('../src/models/ServicePackage');
const Booking = require('../src/models/Booking');
const BookingCapacity = require('../src/models/BookingCapacity');
const AutomationRule = require('../src/models/AutomationRule');
const AutomationLog = require('../src/models/AutomationLog');
const MetaIntegration = require('../src/models/MetaIntegration');
const { encryptToken } = require('../src/utils/cryptoUtils');
const { reviveLegacyValue } = require('../scripts/restore');
const { SECRET_PATHS } = require('../scripts/encryptTenantSecrets');
const { RateLimiter } = require('../src/middlewares/rateLimitMiddleware');

const { ObjectId, MongoClient } = mongoose.mongo;
const execFileAsync = promisify(execFile);

const PORT = 5110;
const BASE = `http://127.0.0.1:${PORT}/api`;
const stamp = Date.now().toString(36);
const createdTenantIds = [];
const createdUserIds = [];
const createdProductIds = [];
const backupsDir = path.resolve(__dirname, '../backups');

let passed = 0;
let failed = 0;
let phoneSeed = 0;
let idSeed = 0;

const check = (name, condition, detail = '') => {
  if (condition) {
    passed += 1;
    console.log(`[PASS] ${name}`);
  } else {
    failed += 1;
    console.log(`[FAIL] ${name}${detail ? ` — ${detail}` : ''}`);
  }
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const nextPhone = () => `9${String(++phoneSeed).padStart(9, '0')}`;
const uid = (prefix) => `${prefix}-${stamp}-${++idSeed}`;
const dateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
const futureDateKey = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return dateKey(date);
};

const request = async (method, endpoint, { token, body, headers: extraHeaders = {} } = {}) => {
  const headers = { ...extraHeaders };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${BASE}${endpoint}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let data = null;
  try {
    data = await response.json();
  } catch {}
  return { status: response.status, data };
};

const rawRequest = async (endpoint, { rawBody, headers = {} } = {}) => {
  const response = await fetch(`${BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: rawBody,
  });
  let data = null;
  try {
    data = await response.json();
  } catch {}
  return { status: response.status, data };
};

const login = async (email, password = 'ProbePass123!') => {
  const response = await request('POST', '/auth/login', { body: { email, password } });
  if (response.status !== 200 || !response.data?.token) {
    throw new Error(`Login failed for ${email}: ${response.status} ${response.data?.message || ''}`);
  }
  return response.data.token;
};

const createTenant = async (
  label,
  { businessType = 'PRODUCT', modules = {}, settings = {} } = {}
) => {
  const tenant = await Tenant.create({
    businessName: `Phase10 ${label} ${stamp}`,
    slug: `phase10-${label}-${stamp}-${++idSeed}`,
    businessType,
    templateCode: businessType,
    status: 'ACTIVE',
    planTier: 'PRO',
    enabledModules: {
      products: true,
      orders: true,
      inventory: true,
      serviceBookings: false,
      travelBookings: false,
      crmLeads: true,
      marketingAds: true,
      automations: true,
      ...modules,
    },
    settings,
  });
  createdTenantIds.push(tenant._id);
  return tenant;
};

const createUser = async (tenant, label, role = 'MERCHANT_OWNER') => {
  const user = await User.create({
    name: `Phase10 ${role} ${label}`,
    email: `phase10-${label}-${stamp}@example.com`,
    password: 'ProbePass123!',
    role,
    businessId: tenant._id,
  });
  createdUserIds.push(user._id);
  return user;
};

const createProduct = async (tenant, { name, price = 100, stock = 20 } = {}) => {
  const product = await Product.create({
    businessId: tenant._id,
    name: name || `Phase10 Product ${++idSeed}`,
    slug: uid('product'),
    price,
    stockQuantity: stock,
    trackQuantity: true,
    isAvailable: true,
    images: [],
  });
  createdProductIds.push(product._id);
  return product;
};

const placeOrder = async (tenant, items, phone = nextPhone(), couponCode = '') =>
  request('POST', `/public/store/${tenant.slug}/orders`, {
    body: {
      customerName: 'Phase10 Customer',
      customerPhone: phone,
      customerEmail: `phase10-customer-${stamp}@example.com`,
      shippingAddress: { street: '1 Test Street', city: 'Delhi', pincode: '110001' },
      items,
      paymentMethod: 'COD',
      couponCode,
    },
  });

const cancelOrder = async (orderId, token) =>
  request('PATCH', `/orders/${orderId}/status`, {
    token,
    body: { orderStatus: 'CANCELLED' },
  });

const cleanup = async () => {
  try {
    if (createdTenantIds.length) {
      await Promise.all([
        AutomationLog.deleteMany({ businessId: { $in: createdTenantIds } }),
        AutomationRule.deleteMany({ businessId: { $in: createdTenantIds } }),
        BookingCapacity.deleteMany({ businessId: { $in: createdTenantIds } }),
        Booking.deleteMany({ businessId: { $in: createdTenantIds } }),
        ServicePackage.deleteMany({ businessId: { $in: createdTenantIds } }),
        MetaIntegration.deleteMany({ businessId: { $in: createdTenantIds } }),
        Order.deleteMany({ businessId: { $in: createdTenantIds } }),
        Lead.deleteMany({ businessId: { $in: createdTenantIds } }),
        Product.deleteMany({ businessId: { $in: createdTenantIds } }),
        Coupon.deleteMany({ businessId: { $in: createdTenantIds } }),
      ]);
      await User.deleteMany({ businessId: { $in: createdTenantIds } });
      await Tenant.deleteMany({ _id: { $in: createdTenantIds } });
    }
    if (createdUserIds.length) await User.deleteMany({ _id: { $in: createdUserIds } });
    if (createdProductIds.length) await Product.deleteMany({ _id: { $in: createdProductIds } });
  } catch (error) {
    console.error('[Phase10 Cleanup Warning]', error.message);
  }
};

const hasIndex = (indexes, key) =>
  indexes.some((index) => JSON.stringify(index.key) === JSON.stringify(key));

const runBackupRestoreTest = async (mongoUri) => {
  const sourceDbName = `omniva_phase10_backup_src_${stamp}`;
  const targetDbName = `omniva_phase10_backup_dst_${stamp}`;
  const replaceDb = (uri, dbName) => {
    const [base, query] = String(uri).split('?');
    const slash = base.lastIndexOf('/');
    return `${base.slice(0, slash)}/${dbName}${query ? `?${query}` : ''}`;
  };
  const sourceUri = replaceDb(mongoUri, sourceDbName);
  const targetUri = replaceDb(mongoUri, targetDbName);
  let snapshotDir = '';

  const tenantId = new ObjectId();
  const userId = new ObjectId();
  const encryptedToken = encryptToken('phase10-restored-page-token');

  try {
    const sourceClient = new MongoClient(sourceUri);
    await sourceClient.connect();
    const sourceDb = sourceClient.db();
    await sourceDb.collection('tenants').insertOne({
      _id: tenantId,
      businessName: 'Phase10 Restore Tenant',
      slug: `phase10-restore-${stamp}`,
      status: 'ACTIVE',
      createdAt: new Date('2026-01-02T03:04:05.000Z'),
      settings: { currency: 'INR' },
    });
    await sourceDb.collection('users').insertOne({
      _id: userId,
      businessId: tenantId,
      name: 'Phase10 Restore Owner',
      email: `phase10-restore-${stamp}@example.com`,
      role: 'MERCHANT_OWNER',
      createdAt: new Date('2026-01-02T03:04:05.000Z'),
    });
    await sourceDb.collection('metaIntegrations').insertOne({
      _id: new ObjectId(),
      businessId: tenantId,
      status: 'CONNECTED',
      encryptedUserAccessToken: encryptedToken,
      encryptedPageAccessToken: encryptedToken,
      createdAt: new Date('2026-01-02T03:04:05.000Z'),
    });
    await sourceClient.close();

    if (!fs.existsSync(backupsDir)) fs.mkdirSync(backupsDir, { recursive: true });
    const before = new Set(
      fs.readdirSync(backupsDir).filter((name) => name.startsWith('snapshot-'))
    );
    await execFileAsync(process.execPath, [path.resolve(__dirname, '../scripts/backup.js')], {
      cwd: path.resolve(__dirname, '..'),
      env: { ...process.env, MONGODB_URI: sourceUri },
      timeout: 120000,
    });
    const createdSnapshots = fs
      .readdirSync(backupsDir)
      .filter((name) => name.startsWith('snapshot-') && !before.has(name));
    check(
      'Backup creates a new timestamped snapshot',
      createdSnapshots.length === 1,
      `created=${createdSnapshots.length}`
    );
    if (!createdSnapshots.length) return;
    snapshotDir = path.join(backupsDir, createdSnapshots[0]);
    const manifest = JSON.parse(fs.readFileSync(path.join(snapshotDir, 'manifest.json'), 'utf8'));
    check(
      'Backup manifest records EJSON v2 and archives documents',
      manifest.format === 'EJSON' && manifest.formatVersion === 2 && manifest.totalDocuments >= 3,
      `format=${manifest.format}, version=${manifest.formatVersion}, docs=${manifest.totalDocuments}`
    );

    await execFileAsync(
      process.execPath,
      [
        path.resolve(__dirname, '../scripts/restore.js'),
        '--snapshot',
        snapshotDir,
        '--yes',
        '--uri',
        targetUri,
      ],
      {
        cwd: path.resolve(__dirname, '..'),
        env: { ...process.env },
        timeout: 120000,
      }
    );

    const targetClient = new MongoClient(targetUri);
    await targetClient.connect();
    const targetDb = targetClient.db();
    const restoredTenant = await targetDb.collection('tenants').findOne({ _id: tenantId });
    const restoredUser = await targetDb.collection('users').findOne({ _id: userId });
    const restoredMeta = await targetDb.collection('metaIntegrations').findOne({ businessId: tenantId });
    check(
      'Restore preserves ObjectId tenant ids',
      restoredTenant?._id instanceof ObjectId,
      `type=${restoredTenant?._id?.constructor?.name}`
    );
    check(
      'Restore preserves Date fields',
      restoredTenant?.createdAt instanceof Date,
      `type=${restoredTenant?.createdAt?.constructor?.name}`
    );
    check(
      'Restore preserves user tenant references as ObjectId',
      restoredUser?.businessId instanceof ObjectId && restoredUser.businessId.equals(tenantId)
    );
    check(
      'Restore preserves encrypted Meta token ciphertext exactly',
      restoredMeta?.encryptedUserAccessToken === encryptedToken &&
        restoredMeta?.encryptedPageAccessToken === encryptedToken
    );
    await targetClient.close();
  } finally {
    for (const uri of [sourceUri, targetUri]) {
      try {
        const client = new MongoClient(uri);
        await client.connect();
        await client.db().dropDatabase();
        await client.close();
      } catch {}
    }
    if (snapshotDir && fs.existsSync(snapshotDir)) {
      fs.rmSync(snapshotDir, { recursive: true, force: true });
    }
  }
};

const run = async () => {
  console.log('\n============================================================');
  console.log('--- STARTING PHASE 10 LAUNCH HARDENING REGRESSION ---');
  console.log('============================================================\n');

  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/omniva_saas';
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 15000 });
  await Promise.all([
    BookingCapacity.createIndexes(),
    Order.createIndexes(),
    Lead.createIndexes(),
  ]);

  const server = app.listen(PORT, '127.0.0.1');
  await once(server, 'listening');

  try {
    // ---------------------------------------------------------------------
    // 1. Coupon usage returns exactly once on cancellation
    // ---------------------------------------------------------------------
    const couponTenant = await createTenant('coupon', {
      settings: { shippingFee: 0, freeShippingThreshold: 0 },
    });
    const couponOwner = await createUser(couponTenant, 'coupon-owner');
    const couponToken = await login(couponOwner.email);
    const couponProduct = await createProduct(couponTenant, {
      name: 'Coupon Probe Product',
      price: 500,
      stock: 20,
    });
    const coupon = await Coupon.create({
      businessId: couponTenant._id,
      code: `SAVE${stamp}`.toUpperCase(),
      discountType: 'FLAT',
      discountValue: 100,
      usageLimit: 1,
      isActive: true,
    });

    const couponOrder = await placeOrder(
      couponTenant,
      [{ productId: couponProduct._id.toString(), quantity: 1 }],
      nextPhone(),
      coupon.code
    );
    check(
      'Coupon checkout succeeds and reserves the only usage',
      couponOrder.status === 201 &&
        (await Coupon.findById(coupon._id).lean()).usageCount === 1,
      `status=${couponOrder.status}`
    );
    const couponOrderDoc = couponOrder.data?.data?._id
      ? await Order.findById(couponOrder.data.data._id)
      : null;
    check(
      'Order totals use server line prices and server coupon discount',
      couponOrderDoc?.subtotal === 500 &&
        couponOrderDoc?.discount === 100 &&
        couponOrderDoc?.totalAmount === 400,
      `subtotal=${couponOrderDoc?.subtotal}, discount=${couponOrderDoc?.discount}, total=${couponOrderDoc?.totalAmount}`
    );

    const couponCancel = couponOrderDoc
      ? await cancelOrder(couponOrderDoc._id, couponToken)
      : { status: 0 };
    const afterCancelCoupon = await Coupon.findById(coupon._id).lean();
    check(
      'Cancelling an order restores one coupon use',
      couponCancel.status === 200 &&
        afterCancelCoupon.usageCount === 0 &&
        (await Order.findById(couponOrderDoc._id).lean()).couponUsageRestored === true,
      `status=${couponCancel.status}, usage=${afterCancelCoupon.usageCount}`
    );
    const secondCancel = couponOrderDoc
      ? await cancelOrder(couponOrderDoc._id, couponToken)
      : { status: 0 };
    check(
      'Repeated cancellation is rejected and does not decrement coupon twice',
      secondCancel.status === 409 &&
        (await Coupon.findById(coupon._id).lean()).usageCount === 0,
      `status=${secondCancel.status}, usage=${(await Coupon.findById(coupon._id).lean()).usageCount}`
    );
    const couponReuse = await placeOrder(
      couponTenant,
      [{ productId: couponProduct._id.toString(), quantity: 1 }],
      nextPhone(),
      coupon.code
    );
    check(
      'Released coupon can be used by the next customer',
      couponReuse.status === 201,
      `status=${couponReuse.status}, message=${couponReuse.data?.message || ''}`
    );

    // ---------------------------------------------------------------------
    // 2. COD delivery does not imply payment; revenue is paid-status aware
    // ---------------------------------------------------------------------
    const revenueTenant = await createTenant('revenue', {
      settings: { shippingFee: 0, freeShippingThreshold: 0 },
    });
    const revenueOwner = await createUser(revenueTenant, 'revenue-owner');
    const revenueToken = await login(revenueOwner.email);
    const revenueProduct = await createProduct(revenueTenant, {
      name: 'Revenue Probe Product',
      price: 100,
      stock: 50,
    });
    const revenueOrders = [];
    const revenuePhones = [];
    for (let index = 0; index < 3; index += 1) {
      const phone = nextPhone();
      revenuePhones.push(phone);
      const response = await placeOrder(
        revenueTenant,
        [{ productId: revenueProduct._id.toString(), quantity: 1 }],
        phone
      );
      if (response.status === 201) revenueOrders.push(response.data.data);
    }
    check('Three COD probe orders are created', revenueOrders.length === 3);

    const delivered = revenueOrders[0]
      ? await request('PATCH', `/orders/${revenueOrders[0]._id}/status`, {
          token: revenueToken,
          body: { orderStatus: 'DELIVERED' },
        })
      : { status: 0 };
    const deliveredDoc = revenueOrders[0]
      ? await Order.findById(revenueOrders[0]._id).lean()
      : null;
    check(
      'Marking a COD order DELIVERED does not mark it PAID',
      delivered.status === 200 &&
        deliveredDoc?.orderStatus === 'DELIVERED' &&
        deliveredDoc?.paymentStatus === 'PENDING',
      `status=${delivered.status}, payment=${deliveredDoc?.paymentStatus}`
    );

    const statsAfterDelivery = await request('GET', '/orders/stats', { token: revenueToken });
    check(
      'Delivered COD revenue is included but paidRevenue stays zero until payment',
      statsAfterDelivery.status === 200 &&
        statsAfterDelivery.data?.data?.revenue?.totalRevenue === 300 &&
        statsAfterDelivery.data?.data?.revenue?.paidRevenue === 0,
      `total=${statsAfterDelivery.data?.data?.revenue?.totalRevenue}, paid=${statsAfterDelivery.data?.data?.revenue?.paidRevenue}`
    );

    const paidOrder = revenueOrders[1]
      ? await request('PATCH', `/orders/${revenueOrders[1]._id}/status`, {
          token: revenueToken,
          body: { paymentStatus: 'PAID', orderStatus: 'CONFIRMED' },
        })
      : { status: 0 };
    const statsAfterPaid = await request('GET', '/orders/stats', { token: revenueToken });
    check(
      'paidRevenue updates only after an explicit PAID transition',
      paidOrder.status === 200 &&
        statsAfterPaid.data?.data?.revenue?.paidRevenue === 100 &&
        statsAfterPaid.data?.data?.revenue?.totalRevenue === 300,
      `status=${paidOrder.status}, paid=${statsAfterPaid.data?.data?.revenue?.paidRevenue}`
    );
    const invalidPayment = revenueOrders[1]
      ? await request('PATCH', `/orders/${revenueOrders[1]._id}/status`, {
          token: revenueToken,
          body: { paymentStatus: 'NOT_A_STATUS' },
        })
      : { status: 0 };
    check('Invalid payment status is rejected with 400', invalidPayment.status === 400);

    const cancelledRevenueOrder = revenueOrders[2]
      ? await cancelOrder(revenueOrders[2]._id, revenueToken)
      : { status: 0 };
    const statsAfterCancel = await request('GET', '/orders/stats', { token: revenueToken });
    check(
      'Cancelled orders are excluded from revenue but remain in totalOrders',
      cancelledRevenueOrder.status === 200 &&
        statsAfterCancel.data?.data?.totalOrders === 3 &&
        statsAfterCancel.data?.data?.revenue?.totalRevenue === 200 &&
        statsAfterCancel.data?.data?.revenue?.paidRevenue === 100,
      `totalOrders=${statsAfterCancel.data?.data?.totalOrders}, totalRevenue=${statsAfterCancel.data?.data?.revenue?.totalRevenue}`
    );

    // ---------------------------------------------------------------------
    // 3. Legacy phone formats remain trackable, invalid input denied
    // ---------------------------------------------------------------------
    const trackingOrder = revenueOrders[1];
    const trackingPhone = trackingOrder.customerPhone;
    await Order.updateOne(
      { _id: trackingOrder._id },
      { $set: { customerPhone: `91${trackingPhone}` } }
    );
    const legacyTrack = await request(
      'GET',
      `/public/orders/track?orderNumber=${encodeURIComponent(trackingOrder.orderNumber)}&phone=${trackingPhone}&slug=${revenueTenant.slug}`
    );
    check(
      'Tracking accepts a legacy +91 stored phone using a plain 10-digit input',
      legacyTrack.status === 200 && legacyTrack.data?.success === true,
      `status=${legacyTrack.status}`
    );
    await Order.updateOne(
      { _id: trackingOrder._id },
      { $set: { customerPhone: `0${trackingPhone}` } }
    );
    const zeroTrack = await request(
      'GET',
      `/public/orders/track?orderNumber=${encodeURIComponent(trackingOrder.orderNumber)}&phone=${trackingPhone}&slug=${revenueTenant.slug}`
    );
    check('Tracking accepts a legacy 0-prefixed stored phone', zeroTrack.status === 200);
    const shortTrack = await request(
      'GET',
      `/public/orders/track?orderNumber=${encodeURIComponent(trackingOrder.orderNumber)}&phone=12345&slug=${revenueTenant.slug}`
    );
    check('Tracking rejects an invalid short phone instead of matching broadly', shortTrack.status === 400);
    const wrongTrack = await request(
      'GET',
      `/public/orders/track?orderNumber=${encodeURIComponent(trackingOrder.orderNumber)}&phone=${nextPhone()}&slug=${revenueTenant.slug}`
    );
    check('Tracking does not expose an order to the wrong phone', wrongTrack.status === 404);

    // ---------------------------------------------------------------------
    // 4. Staff permission matrix across sensitive endpoints
    // ---------------------------------------------------------------------
    const rbacTenant = await createTenant('rbac');
    const rbacOwner = await createUser(rbacTenant, 'rbac-owner');
    const rbacOrder = await createUser(rbacTenant, 'rbac-order', 'ORDER_MANAGER');
    const rbacInventory = await createUser(rbacTenant, 'rbac-inventory', 'INVENTORY_STAFF');
    const rbacMarketing = await createUser(rbacTenant, 'rbac-marketing', 'MARKETING_STAFF');
    const rbacSupport = await createUser(rbacTenant, 'rbac-support', 'SUPPORT_STAFF');
    const [ownerToken, orderToken, inventoryToken, marketingToken, supportToken] =
      await Promise.all([
        login(rbacOwner.email),
        login(rbacOrder.email),
        login(rbacInventory.email),
        login(rbacMarketing.email),
        login(rbacSupport.email),
      ]);
    const rbacProduct = await createProduct(rbacTenant, {
      name: 'RBAC Probe Product',
      price: 75,
      stock: 10,
    });
    const rbacOrderResponse = await placeOrder(
      rbacTenant,
      [{ productId: rbacProduct._id.toString(), quantity: 1 }],
      nextPhone()
    );
    const rbacOrderId = rbacOrderResponse.data?.data?._id;

    const productPayload = () => ({
      name: `RBAC New Product ${++idSeed}`,
      slug: uid('rbac-product'),
      price: 25,
      stockQuantity: 2,
    });
    const ownerProduct = await request('POST', '/products', { token: ownerToken, body: productPayload() });
    const orderProduct = await request('POST', '/products', { token: orderToken, body: productPayload() });
    const inventoryProduct = await request('POST', '/products', { token: inventoryToken, body: productPayload() });
    const marketingProduct = await request('POST', '/products', { token: marketingToken, body: productPayload() });
    const supportProduct = await request('POST', '/products', { token: supportToken, body: productPayload() });
    check(
      'Product write matrix: owner/inventory allowed; order/marketing/support denied',
      ownerProduct.status === 201 &&
        orderProduct.status === 403 &&
        inventoryProduct.status === 201 &&
        marketingProduct.status === 403 &&
        supportProduct.status === 403,
      `owner=${ownerProduct.status}, order=${orderProduct.status}, inventory=${inventoryProduct.status}, marketing=${marketingProduct.status}, support=${supportProduct.status}`
    );

    const leadPayload = () => ({
      name: `RBAC Lead ${++idSeed}`,
      phone: nextPhone(),
      source: 'MANUAL',
    });
    const ownerLead = await request('POST', '/crm/leads', { token: ownerToken, body: leadPayload() });
    const orderLead = await request('POST', '/crm/leads', { token: orderToken, body: leadPayload() });
    const inventoryLead = await request('POST', '/crm/leads', { token: inventoryToken, body: leadPayload() });
    const marketingLead = await request('POST', '/crm/leads', { token: marketingToken, body: leadPayload() });
    const supportLead = await request('POST', '/crm/leads', { token: supportToken, body: leadPayload() });
    const inventoryLeadRead = await request('GET', '/crm/leads', { token: inventoryToken });
    const supportLeadRead = await request('GET', '/crm/leads', { token: supportToken });
    check(
      'CRM matrix: owner/order/marketing/support allowed; inventory denied PII access',
      ownerLead.status === 201 &&
        orderLead.status === 201 &&
        inventoryLead.status === 403 &&
        marketingLead.status === 201 &&
        supportLead.status === 201 &&
        inventoryLeadRead.status === 403 &&
        supportLeadRead.status === 200,
      `owner=${ownerLead.status}, order=${orderLead.status}, inventory=${inventoryLead.status}, marketing=${marketingLead.status}, support=${supportLead.status}, invRead=${inventoryLeadRead.status}, supRead=${supportLeadRead.status}`
    );

    const rulePayload = () => ({
      name: `RBAC Rule ${++idSeed}`,
      trigger: 'ORDER_CREATED',
      action: { type: 'IN_APP_ALERT', target: 'owner', template: 'Probe alert' },
      isActive: true,
    });
    const ownerRule = await request('POST', '/automations/rules', { token: ownerToken, body: rulePayload() });
    const orderRule = await request('POST', '/automations/rules', { token: orderToken, body: rulePayload() });
    const inventoryRule = await request('POST', '/automations/rules', { token: inventoryToken, body: rulePayload() });
    const marketingRule = await request('POST', '/automations/rules', { token: marketingToken, body: rulePayload() });
    const supportRule = await request('POST', '/automations/rules', { token: supportToken, body: rulePayload() });
    check(
      'Automation write matrix: owner/marketing allowed; order/inventory/support denied',
      ownerRule.status === 201 &&
        orderRule.status === 403 &&
        inventoryRule.status === 403 &&
        marketingRule.status === 201 &&
        supportRule.status === 403,
      `owner=${ownerRule.status}, order=${orderRule.status}, inventory=${inventoryRule.status}, marketing=${marketingRule.status}, support=${supportRule.status}`
    );

    const usageStatuses = await Promise.all(
      [ownerToken, orderToken, inventoryToken, marketingToken, supportToken].map(
        async (token) => (await request('GET', '/subscriptions/usage', { token })).status
      )
    );
    check(
      'Subscription usage matrix: support denied, operational roles allowed',
      usageStatuses[0] === 200 &&
        usageStatuses[1] === 200 &&
        usageStatuses[2] === 200 &&
        usageStatuses[3] === 200 &&
        usageStatuses[4] === 403,
      usageStatuses.join(',')
    );

    const statsStatuses = await Promise.all(
      [ownerToken, orderToken, inventoryToken, marketingToken, supportToken].map(
        async (token) => (await request('GET', '/orders/stats', { token })).status
      )
    );
    check(
      'Revenue analytics matrix: inventory/support cannot read company revenue',
      statsStatuses[0] === 200 &&
        statsStatuses[1] === 200 &&
        statsStatuses[2] === 403 &&
        statsStatuses[3] === 200 &&
        statsStatuses[4] === 403,
      statsStatuses.join(',')
    );

    const profileStatuses = await Promise.all(
      [ownerToken, orderToken, inventoryToken, marketingToken, supportToken].map(
        async (token) =>
          (
            await request('PUT', '/auth/business-profile', {
              token,
              body: { brandTagline: `Probe ${stamp}` },
            })
          ).status
      )
    );
    check(
      'Business profile settings are owner-only',
      profileStatuses[0] === 200 &&
        profileStatuses.slice(1).every((status) => status === 403),
      profileStatuses.join(',')
    );

    const integrationStatuses = await Promise.all(
      [ownerToken, orderToken, inventoryToken, marketingToken, supportToken].map(
        async (token) => (await request('GET', '/integrations', { token })).status
      )
    );
    check(
      'Integration secrets are owner-only',
      integrationStatuses[0] === 200 &&
        integrationStatuses.slice(1).every((status) => status === 403),
      integrationStatuses.join(',')
    );

    const metaSettingsStatuses = await Promise.all(
      [ownerToken, orderToken, inventoryToken, marketingToken, supportToken].map(
        async (token) => (await request('GET', '/meta/settings', { token })).status
      )
    );
    check(
      'Meta settings matrix: owner/marketing allowed, other staff denied',
      metaSettingsStatuses[0] === 200 &&
        metaSettingsStatuses[1] === 403 &&
        metaSettingsStatuses[2] === 403 &&
        metaSettingsStatuses[3] === 200 &&
        metaSettingsStatuses[4] === 403,
      metaSettingsStatuses.join(',')
    );

    const marketingStatusAttempt = rbacOrderId
      ? await request('PATCH', `/orders/${rbacOrderId}/status`, {
          token: marketingToken,
          body: { orderStatus: 'CONFIRMED' },
        })
      : { status: 0 };
    const supportStatusAttempt = rbacOrderId
      ? await request('PATCH', `/orders/${rbacOrderId}/status`, {
          token: supportToken,
          body: { orderStatus: 'CONFIRMED' },
        })
      : { status: 0 };
    const orderManagerConfirm = rbacOrderId
      ? await request('PATCH', `/orders/${rbacOrderId}/status`, {
          token: orderToken,
          body: { orderStatus: 'CONFIRMED' },
        })
      : { status: 0 };
    const orderManagerShip = rbacOrderId
      ? await request('PATCH', `/orders/${rbacOrderId}/status`, {
          token: orderToken,
          body: { orderStatus: 'SHIPPED' },
        })
      : { status: 0 };
    const inventoryShip = rbacOrderId
      ? await request('PATCH', `/orders/${rbacOrderId}/status`, {
          token: inventoryToken,
          body: { orderStatus: 'SHIPPED' },
        })
      : { status: 0 };
    const inventoryCancel = rbacOrderId
      ? await request('PATCH', `/orders/${rbacOrderId}/status`, {
          token: inventoryToken,
          body: { orderStatus: 'CANCELLED' },
        })
      : { status: 0 };
    const orderPayment = rbacOrderId
      ? await request('PATCH', `/orders/${rbacOrderId}/status`, {
          token: orderToken,
          body: { paymentStatus: 'PAID' },
        })
      : { status: 0 };
    const ownerPayment = rbacOrderId
      ? await request('PATCH', `/orders/${rbacOrderId}/status`, {
          token: ownerToken,
          body: { paymentStatus: 'PAID' },
        })
      : { status: 0 };
    check(
      'Order status matrix enforces role/action boundaries',
      marketingStatusAttempt.status === 403 &&
        supportStatusAttempt.status === 403 &&
        orderManagerConfirm.status === 200 &&
        orderManagerShip.status === 403 &&
        inventoryShip.status === 200 &&
        inventoryCancel.status === 403 &&
        orderPayment.status === 403 &&
        ownerPayment.status === 200,
      `marketing=${marketingStatusAttempt.status}, support=${supportStatusAttempt.status}, orderConfirm=${orderManagerConfirm.status}, orderShip=${orderManagerShip.status}, invShip=${inventoryShip.status}, invCancel=${inventoryCancel.status}, orderPay=${orderPayment.status}, ownerPay=${ownerPayment.status}`
    );

    const orderStaffCreate = await request('POST', '/auth/staff', {
      token: orderToken,
      body: {
        name: 'Forbidden Staff',
        email: `forbidden-staff-${stamp}@example.com`,
        password: 'ProbePass123!',
        role: 'SUPPORT_STAFF',
      },
    });
    check('Non-owner cannot create staff accounts', orderStaffCreate.status === 403);

    const staffCreateTenant = await createTenant('staffcreate');
    const staffCreateOwner = await createUser(staffCreateTenant, 'staffcreate-owner');
    const staffCreateToken = await login(staffCreateOwner.email);
    const createdStaff = await request('POST', '/auth/staff', {
      token: staffCreateToken,
      body: {
        name: 'Allowed Staff',
        email: `allowed-staff-${stamp}@example.com`,
        password: 'ProbePass123!',
        role: 'SUPPORT_STAFF',
      },
    });
    check('Owner can create a staff account within quota', createdStaff.status === 201);

    // ---------------------------------------------------------------------
    // 5. Product deletion cannot fall back to a same-named product
    // ---------------------------------------------------------------------
    const deletedProduct = await createProduct(rbacTenant, {
      name: `Deleted Probe ${stamp}`,
      price: 80,
      stock: 5,
    });
    const sameNameProduct = await createProduct(rbacTenant, {
      name: `Deleted Probe ${stamp}`,
      price: 90,
      stock: 5,
    });
    const deleteResponse = await request('DELETE', `/products/${deletedProduct._id}`, {
      token: ownerToken,
    });
    const ordersBeforeDeletedCheckout = await Order.countDocuments({ businessId: rbacTenant._id });
    const deletedCheckout = await placeOrder(
      rbacTenant,
      [{ productId: deletedProduct._id.toString(), name: deletedProduct.name, quantity: 1 }],
      nextPhone()
    );
    const ordersAfterDeletedCheckout = await Order.countDocuments({ businessId: rbacTenant._id });
    check(
      'Deleted product checkout returns 400 and does not substitute a same-named product',
      deleteResponse.status === 200 &&
        deletedCheckout.status === 400 &&
        ordersBeforeDeletedCheckout === ordersAfterDeletedCheckout,
      `delete=${deleteResponse.status}, checkout=${deletedCheckout.status}, before=${ordersBeforeDeletedCheckout}, after=${ordersAfterDeletedCheckout}`
    );
    const sameNameOrder = await placeOrder(
      rbacTenant,
      [{ productId: sameNameProduct._id.toString(), quantity: 1 }],
      nextPhone()
    );
    check('An existing same-named product remains orderable by its own id', sameNameOrder.status === 201);

    // ---------------------------------------------------------------------
    // 6. Stock race: 8 buyers, 5 units, no oversell
    // ---------------------------------------------------------------------
    const stockTenant = await createTenant('stock');
    const stockOwner = await createUser(stockTenant, 'stock-owner');
    const stockToken = await login(stockOwner.email);
    const stockProduct = await createProduct(stockTenant, {
      name: 'Stock Race Product',
      price: 60,
      stock: 5,
    });
    const stockAttempts = await Promise.all(
      Array.from({ length: 8 }, () =>
        placeOrder(
          stockTenant,
          [{ productId: stockProduct._id.toString(), quantity: 1 }],
          nextPhone()
        )
      )
    );
    const stockSuccesses = stockAttempts.filter((result) => result.status === 201);
    const stockFailures = stockAttempts.filter((result) => result.status === 400);
    const stockAfterRace = await Product.findById(stockProduct._id).lean();
    check(
      'Concurrent stock race sells exactly available units',
      stockSuccesses.length === 5 &&
        stockFailures.length === 3 &&
        stockAfterRace.stockQuantity === 0,
      `success=${stockSuccesses.length}, rejected=${stockFailures.length}, stock=${stockAfterRace?.stockQuantity}`
    );
    await Promise.all(
      stockSuccesses.map((result) => cancelOrder(result.data.data._id, stockToken))
    );
    const stockAfterCancels = await Product.findById(stockProduct._id).lean();
    check(
      'Cancelling race winners restores every decremented unit exactly once',
      stockAfterCancels.stockQuantity === 5,
      `stock=${stockAfterCancels.stockQuantity}`
    );

    // ---------------------------------------------------------------------
    // 7. Coupon race: 5 buyers, 1 use
    // ---------------------------------------------------------------------
    const couponRaceTenant = await createTenant('couponrace', {
      settings: { shippingFee: 0, freeShippingThreshold: 0 },
    });
    const couponRaceOwner = await createUser(couponRaceTenant, 'couponrace-owner');
    const couponRaceToken = await login(couponRaceOwner.email);
    const couponRaceProduct = await createProduct(couponRaceTenant, {
      name: 'Coupon Race Product',
      price: 100,
      stock: 20,
    });
    const raceCoupon = await Coupon.create({
      businessId: couponRaceTenant._id,
      code: `RACE${stamp}`.toUpperCase(),
      discountType: 'FLAT',
      discountValue: 10,
      usageLimit: 1,
      isActive: true,
    });
    const couponAttempts = await Promise.all(
      Array.from({ length: 5 }, () =>
        placeOrder(
          couponRaceTenant,
          [{ productId: couponRaceProduct._id.toString(), quantity: 1 }],
          nextPhone(),
          raceCoupon.code
        )
      )
    );
    const couponWinners = couponAttempts.filter((result) => result.status === 201);
    const couponLosers = couponAttempts.filter((result) => result.status === 400);
    const raceCouponAfter = await Coupon.findById(raceCoupon._id).lean();
    const couponRaceStock = await Product.findById(couponRaceProduct._id).lean();
    check(
      'Concurrent coupon race never exceeds usageLimit',
      couponWinners.length === 1 &&
        couponLosers.length === 4 &&
        raceCouponAfter.usageCount === 1 &&
        couponRaceStock.stockQuantity === 19,
      `wins=${couponWinners.length}, losses=${couponLosers.length}, usage=${raceCouponAfter?.usageCount}, stock=${couponRaceStock?.stockQuantity}`
    );
    if (couponWinners.length === 1) {
      await cancelOrder(couponWinners[0].data.data._id, couponRaceToken);
    }
    check(
      'Coupon race winner cancellation returns both coupon use and stock',
      (await Coupon.findById(raceCoupon._id).lean()).usageCount === 0 &&
        (await Product.findById(couponRaceProduct._id).lean()).stockQuantity === 20
    );

    // ---------------------------------------------------------------------
    // 8. 50-line order totals and stock restoration
    // ---------------------------------------------------------------------
    const bulkTenant = await createTenant('bulk', {
      settings: { shippingFee: 0, freeShippingThreshold: 0 },
    });
    const bulkOwner = await createUser(bulkTenant, 'bulk-owner');
    const bulkToken = await login(bulkOwner.email);
    const bulkProducts = await Product.insertMany(
      Array.from({ length: 50 }, (_, index) => ({
        businessId: bulkTenant._id,
        name: `Bulk Product ${index + 1} ${stamp}`,
        slug: `bulk-${stamp}-${index + 1}`,
        price: 10,
        stockQuantity: 2,
        trackQuantity: true,
        isAvailable: true,
        images: [],
      }))
    );
    createdProductIds.push(...bulkProducts.map((product) => product._id));
    const bulkOrder = await placeOrder(
      bulkTenant,
      bulkProducts.map((product) => ({
        productId: product._id.toString(),
        quantity: 1,
      })),
      nextPhone()
    );
    const bulkOrderDoc = bulkOrder.data?.data?._id
      ? await Order.findById(bulkOrder.data.data._id).lean()
      : null;
    const bulkStocks = await Product.find({ businessId: bulkTenant._id })
      .select('stockQuantity')
      .lean();
    check(
      '50-line order has correct line totals, subtotal, total, and stock decrements',
      bulkOrder.status === 201 &&
        bulkOrderDoc?.items?.length === 50 &&
        bulkOrderDoc?.subtotal === 500 &&
        bulkOrderDoc?.totalAmount === 500 &&
        bulkOrderDoc?.items.every((item) => item.subtotal === item.price * item.quantity) &&
        bulkStocks.every((product) => product.stockQuantity === 1),
      `status=${bulkOrder.status}, lines=${bulkOrderDoc?.items?.length}, subtotal=${bulkOrderDoc?.subtotal}, total=${bulkOrderDoc?.totalAmount}`
    );
    if (bulkOrderDoc) {
      await cancelOrder(bulkOrderDoc._id, bulkToken);
    }
    const bulkStocksAfterCancel = await Product.find({ businessId: bulkTenant._id })
      .select('stockQuantity')
      .lean();
    check(
      'Cancelling a 50-line order restores all 50 stock lines',
      bulkStocksAfterCancel.every((product) => product.stockQuantity === 2)
    );

    // ---------------------------------------------------------------------
    // 9. Meta webhook duplicate delivery creates one lead and one automation
    // ---------------------------------------------------------------------
    const metaTenant = await createTenant('meta');
    const metaOwner = await createUser(metaTenant, 'meta-owner');
    await login(metaOwner.email);
    const pageId = `phase10-page-${stamp}`;
    const metaLeadId = `phase10-lead-${stamp}`;
    await MetaIntegration.create({
      businessId: metaTenant._id,
      status: 'CONNECTED',
      encryptedUserAccessToken: encryptToken('phase10-meta-user-token'),
      pages: [
        {
          pageId,
          pageName: 'Phase10 Meta Page',
          encryptedPageAccessToken: encryptToken('phase10-meta-page-token'),
          isSubscribed: true,
          isSelected: true,
        },
      ],
    });
    await AutomationRule.create({
      businessId: metaTenant._id,
      name: 'Phase10 Lead Alert',
      trigger: 'LEAD_INGESTED',
      condition: { field: 'always', operator: 'ALWAYS', value: '' },
      action: { type: 'IN_APP_ALERT', target: 'owner', template: 'Lead {{customerName}}' },
      isActive: true,
    });

    const realFetch = global.fetch;
    global.fetch = async (url, options) => {
      const target = String(url);
      if (target.startsWith('https://graph.facebook.com/')) {
        return new Response(
          JSON.stringify({
            id: metaLeadId,
            created_time: new Date().toISOString(),
            form_id: `phase10-form-${stamp}`,
            form_name: 'Phase10 Form',
            campaign_name: 'Phase10 Campaign',
            platform: 'fb',
            field_data: [
              { name: 'full_name', values: ['Meta Email Probe'] },
              { name: 'email', values: [`phase10-meta-${stamp}@example.com`] },
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      return realFetch(url, options);
    };

    try {
      const webhookBody = JSON.stringify({
        object: 'page',
        entry: [
          {
            id: pageId,
            changes: [
              {
                field: 'leadgen',
                value: {
                  leadgen_id: metaLeadId,
                  form_id: `phase10-form-${stamp}`,
                  ad_id: `phase10-ad-${stamp}`,
                },
              },
            ],
          },
        ],
      });
      const signature = `sha256=${crypto
        .createHmac('sha256', process.env.META_APP_SECRET)
        .update(webhookBody)
        .digest('hex')}`;
      const firstWebhook = await rawRequest(`/webhooks/meta?tenantSlug=${metaTenant.slug}`, {
        rawBody: webhookBody,
        headers: { 'x-hub-signature-256': signature },
      });
      const secondWebhook = await rawRequest(`/webhooks/meta?tenantSlug=${metaTenant.slug}`, {
        rawBody: webhookBody,
        headers: { 'x-hub-signature-256': signature },
      });
      const metaLeads = await Lead.find({ businessId: metaTenant._id, metaLeadId }).lean();
      let leadLogCount = 0;
      for (let attempt = 0; attempt < 20; attempt += 1) {
        leadLogCount = await AutomationLog.countDocuments({
          businessId: metaTenant._id,
          entityId: metaLeads[0]?._id?.toString() || '',
        });
        if (leadLogCount > 0) break;
        await wait(100);
      }
      await wait(300);
      const finalLeadLogCount = await AutomationLog.countDocuments({
        businessId: metaTenant._id,
        entityId: metaLeads[0]?._id?.toString() || '',
      });
      const metaIntegration = await MetaIntegration.findOne({ businessId: metaTenant._id }).lean();
      check(
        'Duplicate Meta webhook deliveries create one email-only lead',
        firstWebhook.status === 200 &&
          secondWebhook.status === 200 &&
          metaLeads.length === 1 &&
          metaLeads[0].phone === '' &&
          metaLeads[0].email === `phase10-meta-${stamp}@example.com`,
        `statuses=${firstWebhook.status}/${secondWebhook.status}, leads=${metaLeads.length}`
      );
      check(
        'Duplicate Meta webhook deliveries create one automation log, not two',
        leadLogCount >= 1 && finalLeadLogCount === 1,
        `first=${leadLogCount}, final=${finalLeadLogCount}`
      );
      check(
        'Meta integration totalLeadsImported increments only for the new lead',
        metaIntegration?.totalLeadsImported === 1,
        `imported=${metaIntegration?.totalLeadsImported}`
      );
    } finally {
      global.fetch = realFetch;
    }

    // ---------------------------------------------------------------------
    // 10. Razorpay replay protection
    // ---------------------------------------------------------------------
    const paymentTenant = await createTenant('payment', {
      settings: { shippingFee: 0, freeShippingThreshold: 0 },
    });
    const paymentOwner = await createUser(paymentTenant, 'payment-owner');
    await login(paymentOwner.email);
    const paymentProduct = await createProduct(paymentTenant, {
      name: 'Payment Probe Product',
      price: 500,
      stock: 10,
    });
    const paymentOrder = await placeOrder(
      paymentTenant,
      [{ productId: paymentProduct._id.toString(), quantity: 1 }],
      nextPhone()
    );
    const paymentOrderId = paymentOrder.data?.data?._id;
    const razorpayBody = JSON.stringify({
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: `pay_phase10_${stamp}`,
            amount: 50000,
            currency: 'INR',
            notes: {
              orderNumber: paymentOrder.data?.data?.orderNumber || '',
              businessId: paymentTenant._id.toString(),
            },
          },
        },
      },
    });
    const razorpaySignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(razorpayBody)
      .digest('hex');
    const razorpayHeaders = { 'x-razorpay-signature': razorpaySignature };
    const firstPayment = await rawRequest('/webhooks/razorpay', {
      rawBody: razorpayBody,
      headers: razorpayHeaders,
    });
    const secondPayment = await rawRequest('/webhooks/razorpay', {
      rawBody: razorpayBody,
      headers: razorpayHeaders,
    });
    const paidDoc = paymentOrderId ? await Order.findById(paymentOrderId).lean() : null;
    const confirmedTimelineCount = paidDoc?.timeline?.filter((item) => item.status === 'CONFIRMED').length || 0;
    check(
      'Replayed Razorpay webhook is idempotent',
      firstPayment.status === 200 &&
        secondPayment.status === 200 &&
        paidDoc?.paymentStatus === 'PAID' &&
        paidDoc?.orderStatus === 'CONFIRMED' &&
        confirmedTimelineCount === 1,
      `statuses=${firstPayment.status}/${secondPayment.status}, payment=${paidDoc?.paymentStatus}, timeline=${confirmedTimelineCount}`
    );

    // ---------------------------------------------------------------------
    // 11. Proxy-aware rate limiting cannot be spoofed without trust proxy
    // ---------------------------------------------------------------------
    const listenRateApp = async (trustProxy) => {
      const rateApp = express();
      rateApp.set('trust proxy', trustProxy);
      const limiter = new RateLimiter(60 * 1000, 2);
      rateApp.use(limiter.middleware());
      rateApp.get('/', (req, res) => res.json({ success: true, ip: req.ip }));
      const listener = rateApp.listen(0, '127.0.0.1');
      await once(listener, 'listening');
      return listener;
    };
    const callRateApp = (listener, forwardedFor) =>
      fetch(`http://127.0.0.1:${listener.address().port}/`, {
        headers: { 'X-Forwarded-For': forwardedFor },
      });
    const originalDisableRateLimit = process.env.DISABLE_RATE_LIMIT;
    process.env.DISABLE_RATE_LIMIT = 'false';
    let noTrustListener = null;
    let trustListener = null;
    try {
      noTrustListener = await listenRateApp(false);
      const noTrustResults = [];
      for (const ip of ['1.1.1.1', '2.2.2.2', '3.3.3.3']) {
        noTrustResults.push((await callRateApp(noTrustListener, ip)).status);
      }
      check(
        'Spoofed X-Forwarded-For is ignored when trust proxy is off',
        noTrustResults.join(',') === '200,200,429',
        'statuses=' + noTrustResults.join(',')
      );
    } finally {
      if (noTrustListener) await new Promise((resolve) => noTrustListener.close(resolve));
    }
    try {
      trustListener = await listenRateApp(true);
      const trustResults = [];
      for (const ip of ['4.4.4.4', '5.5.5.5', '6.6.6.6', '7.7.7.7']) {
        trustResults.push((await callRateApp(trustListener, ip)).status);
      }
      check(
        'Configured trust proxy uses the forwarded client IP for separate buckets',
        trustResults.join(',') === '200,200,200,200',
        'statuses=' + trustResults.join(',')
      );
    } finally {
      if (trustListener) await new Promise((resolve) => trustListener.close(resolve));
      process.env.DISABLE_RATE_LIMIT = originalDisableRateLimit || 'true';
    }

    // ---------------------------------------------------------------------
    // 12. Index existence + explain on hot order query
    // ---------------------------------------------------------------------
    const orderIndexes = await Order.collection.indexes();
    const leadIndexes = await Lead.collection.indexes();
    const capacityIndexes = await BookingCapacity.collection.indexes();
    check(
      'Order tenant/status/date compound index exists',
      hasIndex(orderIndexes, { businessId: 1, orderStatus: 1, createdAt: -1 })
    );
    check(
      'Lead tenant/metaLeadId partial unique index exists',
      hasIndex(leadIndexes, { businessId: 1, metaLeadId: 1 }) &&
        Boolean(leadIndexes.find((index) => index.unique && hasIndex([index], { businessId: 1, metaLeadId: 1 })))
    );
    check(
      'BookingCapacity unique tenant/package/date index exists',
      hasIndex(capacityIndexes, { businessId: 1, packageId: 1, dateKey: 1 }) &&
        Boolean(
          capacityIndexes.find(
            (index) =>
              index.unique && hasIndex([index], { businessId: 1, packageId: 1, dateKey: 1 })
          )
        )
    );
    const orderExplain = await Order.collection
      .find({ businessId: revenueTenant._id, orderStatus: 'NEW' })
      .sort({ createdAt: -1 })
      .hint({ businessId: 1, orderStatus: 1, createdAt: -1 })
      .explain('executionStats');
    check(
      'Order hot-query explain reports an IXSCAN using the compound index',
      JSON.stringify(orderExplain.queryPlanner.winningPlan).includes('IXSCAN') &&
        Number(orderExplain.executionStats?.totalKeysExamined) >= 0,
      `keysExamined=${orderExplain.executionStats?.totalKeysExamined}`
    );

    // ---------------------------------------------------------------------
    // 13. Booking past-date, capacity, cancellation release, and race
    // ---------------------------------------------------------------------
    const bookingTenant = await createTenant('booking', {
      businessType: 'SERVICE',
      modules: { serviceBookings: true, products: false },
    });
    const bookingOwner = await createUser(bookingTenant, 'booking-owner');
    const bookingToken = await login(bookingOwner.email);
    const bookingPackage = await ServicePackage.create({
      businessId: bookingTenant._id,
      name: 'Phase10 Consultation',
      slug: uid('consultation'),
      price: 1000,
      duration: '1 Hour',
      maxCapacityPerDay: 1,
      isAvailable: true,
    });
    const book = (eventDate) =>
      request('POST', `/public/store/${bookingTenant.slug}/book`, {
        body: {
          packageId: bookingPackage._id.toString(),
          customerName: 'Phase10 Booking Customer',
          customerPhone: nextPhone(),
          customerEmail: `phase10-booking-${stamp}@example.com`,
          eventDate,
          timeSlot: '10:00 AM',
          location: 'Delhi',
        },
      });

    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);
    const pastBooking = await book(dateKey(pastDate));
    check('Booking rejects a past date with 400', pastBooking.status === 400);
    const farFutureBooking = await book('2100-01-01');
    check('Booking rejects an absurd far-future date with 400', farFutureBooking.status === 400);

    const capacityDate = futureDateKey(10);
    const firstBooking = await book(capacityDate);
    const firstBookingDoc = firstBooking.data?.data?.bookingId
      ? await Booking.findById(firstBooking.data.data.bookingId).lean()
      : null;
    const secondBooking = await book(capacityDate);
    const capacityCounter = await BookingCapacity.findOne({
      businessId: bookingTenant._id,
      packageId: bookingPackage._id,
      dateKey: capacityDate,
    }).lean();
    check(
      'Booking capacity blocks a second booking on a full date',
      firstBooking.status === 201 &&
        secondBooking.status === 409 &&
        capacityCounter?.reservedCount === 1,
      `first=${firstBooking.status}, second=${secondBooking.status}, reserved=${capacityCounter?.reservedCount}`
    );
    const cancelBookingResponse = firstBookingDoc
      ? await request('PATCH', `/bookings/${firstBookingDoc._id}/status`, {
          token: bookingToken,
          body: { bookingStatus: 'CANCELLED' },
        })
      : { status: 0 };
    const capacityAfterCancel = await BookingCapacity.findOne({
      businessId: bookingTenant._id,
      packageId: bookingPackage._id,
      dateKey: capacityDate,
    }).lean();
    const rebook = await book(capacityDate);
    check(
      'Cancelling a booking releases exactly one capacity unit',
      cancelBookingResponse.status === 200 &&
        capacityAfterCancel?.reservedCount === 0 &&
        rebook.status === 201,
      `cancel=${cancelBookingResponse.status}, reserved=${capacityAfterCancel?.reservedCount}, rebook=${rebook.status}`
    );

    const raceDate = futureDateKey(20);
    const bookingRaceAttempts = await Promise.all(
      Array.from({ length: 5 }, () => book(raceDate))
    );
    const bookingRaceWins = bookingRaceAttempts.filter((result) => result.status === 201);
    const bookingRaceLosses = bookingRaceAttempts.filter((result) => result.status === 409);
    const raceCounter = await BookingCapacity.findOne({
      businessId: bookingTenant._id,
      packageId: bookingPackage._id,
      dateKey: raceDate,
    }).lean();
    const raceBookings = await Booking.countDocuments({
      businessId: bookingTenant._id,
      capacityDateKey: raceDate,
      bookingStatus: { $ne: 'CANCELLED' },
    });
    check(
      'Concurrent booking race accepts exactly one capacity unit',
      bookingRaceWins.length === 1 &&
        bookingRaceLosses.length === 4 &&
        raceCounter?.reservedCount === 1 &&
        raceBookings === 1,
      `wins=${bookingRaceWins.length}, losses=${bookingRaceLosses.length}, reserved=${raceCounter?.reservedCount}, bookings=${raceBookings}`
    );

    // ---------------------------------------------------------------------
    // 14. Dashboard file verification
    // ---------------------------------------------------------------------
    const dashboardPath = path.resolve(__dirname, '../../frontend/src/pages/MerchantDashboard.jsx');
    const dashboardSource = fs.readFileSync(dashboardPath, 'utf8');
    const dashboardLines = dashboardSource.split(/\r?\n/).length;
    check(
      'MerchantDashboard.jsx exists and contains the full dashboard',
      fs.existsSync(dashboardPath) && dashboardLines > 11000 && dashboardSource.length > 600000,
      `lines=${dashboardLines}, bytes=${dashboardSource.length}`
    );

    // ---------------------------------------------------------------------
    // 15. Secret migration and backup -> restore with type preservation
    // ---------------------------------------------------------------------
    check(
      'Tenant secret encryption migration module loads its model and paths',
      Array.isArray(SECRET_PATHS) &&
        SECRET_PATHS.length >= 8 &&
        SECRET_PATHS.some((p) => p.join('.') === 'settings.metaCapiToken') &&
        SECRET_PATHS.some((p) => p.join('.') === 'integrations.whatsapp.accessToken'),
      `paths=${Array.isArray(SECRET_PATHS) ? SECRET_PATHS.length : 'missing'}`
    );

    const legacyRevived = reviveLegacyValue({
      _id: '0123456789abcdef01234567',
      businessId: 'abcdefabcdefabcdefabcdef',
      createdAt: '2026-01-02T03:04:05.000Z',
    });
    check(
      'Legacy JSON restore revives ObjectId references and Date fields',
      legacyRevived._id instanceof ObjectId &&
        legacyRevived.businessId instanceof ObjectId &&
        legacyRevived.createdAt instanceof Date
    );
    try {
      await runBackupRestoreTest(mongoUri);
    } catch (error) {
      check('Backup and restore round-trip completes', false, error.message);
    }
  } catch (error) {
    failed += 1;
    console.error('[Phase10 Fatal Error]', error);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await cleanup();
    await mongoose.disconnect();
  }

  console.log('\n============================================================');
  console.log(`--- PHASE 10 RESULT: ${passed} passed, ${failed} failed ---`);
  console.log('============================================================\n');
  if (failed > 0) process.exitCode = 1;
};

run().catch((error) => {
  console.error('[Phase10 Runner Error]', error);
  process.exitCode = 1;
});
