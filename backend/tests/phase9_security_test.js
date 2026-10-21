process.env.NODE_ENV = 'test';

const path = require('path');
const http = require('http');
const crypto = require('crypto');
const { once } = require('events');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Use a unique value so the regression can prove it never reaches a browser.
const PROBE_META_VERIFY_TOKEN = `phase9-verify-${Date.now().toString(36)}`;
process.env.META_WEBHOOK_VERIFY_TOKEN = PROBE_META_VERIFY_TOKEN;

const mongoose = require('mongoose');
const { app } = require('../src/server');
const Tenant = require('../src/models/Tenant');
const User = require('../src/models/User');
const Order = require('../src/models/Order');
const Product = require('../src/models/Product');
const Lead = require('../src/models/Lead');
const Coupon = require('../src/models/Coupon');
const AutomationRule = require('../src/models/AutomationRule');
const AutomationLog = require('../src/models/AutomationLog');
const { triggerAutomation } = require('../src/services/automationEngine');
const {
  assertSafeOutboundUrl,
  isPrivateAddress,
} = require('../src/utils/outboundUrlGuard');

const PORT = 5109;
const BASE = `http://127.0.0.1:${PORT}/api`;
const stamp = Date.now().toString(36);
const createdTenantIds = [];
const createdUserIds = [];
const createdProductIds = [];
const createdOrderIds = [];
const createdLeadIds = [];

let passed = 0;
let failed = 0;
let ssrfListener = null;
const check = (name, condition, detail = '') => {
  if (condition) {
    passed += 1;
    console.log(`[PASS] ${name}`);
  } else {
    failed += 1;
    console.log(`[FAIL] ${name}${detail ? ` — ${detail}` : ''}`);
  }
};

const request = async (method, endpoint, { token, body, headers: extraHeaders = {} } = {}) => {
  const headers = { ...extraHeaders };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${endpoint}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let data = null;
  try {
    data = await res.json();
  } catch {}
  return { status: res.status, data };
};

const login = async (email, password) => {
  const res = await request('POST', '/auth/login', { body: { email, password } });
  if (res.status !== 200 || !res.data?.token) {
    throw new Error(`Login failed for ${email}: ${res.status} ${res.data?.message || ''}`);
  }
  return res.data.token;
};

const createTenant = async (label, planTier = 'GROWTH') => {
  const tenant = await Tenant.create({
    businessName: `Probe ${label} ${stamp}`,
    slug: `probe-${label}-${stamp}`,
    businessType: 'PRODUCT',
    templateCode: 'PRODUCT',
    status: 'ACTIVE',
    planTier,
  });
  createdTenantIds.push(tenant._id);
  return tenant;
};

const createOwner = async (tenant, label) => {
  const user = await User.create({
    name: `Probe Owner ${label}`,
    email: `probe-owner-${label}-${stamp}@example.com`,
    password: 'ProbePass123!',
    role: 'MERCHANT_OWNER',
    businessId: tenant._id,
  });
  createdUserIds.push(user._id);
  return user;
};

const createStaff = async (tenant, label, role = 'ORDER_MANAGER') => {
  const user = await User.create({
    name: `Probe Staff ${label}`,
    email: `probe-staff-${label}-${stamp}@example.com`,
    password: 'ProbePass123!',
    role,
    businessId: tenant._id,
  });
  createdUserIds.push(user._id);
  return user;
};

const cleanup = async () => {
  try {
    if (createdTenantIds.length) {
      await Promise.all([
        AutomationLog.deleteMany({ businessId: { $in: createdTenantIds } }),
        AutomationRule.deleteMany({ businessId: { $in: createdTenantIds } }),
        Order.deleteMany({ businessId: { $in: createdTenantIds } }),
        Lead.deleteMany({ businessId: { $in: createdTenantIds } }),
        Product.deleteMany({ businessId: { $in: createdTenantIds } }),
        Coupon.deleteMany({ businessId: { $in: createdTenantIds } }),
      ]);
      await User.deleteMany({ businessId: { $in: createdTenantIds } });
      await Tenant.deleteMany({ _id: { $in: createdTenantIds } });
    }
    if (createdUserIds.length) {
      await User.deleteMany({ _id: { $in: createdUserIds } });
    }
    if (createdProductIds.length) {
      await Product.deleteMany({ _id: { $in: createdProductIds } });
    }
    if (createdOrderIds.length) {
      await Order.deleteMany({ _id: { $in: createdOrderIds } });
    }
    if (createdLeadIds.length) {
      await Lead.deleteMany({ _id: { $in: createdLeadIds } });
    }
  } catch (cleanupErr) {
    console.error('[Cleanup Warning]', cleanupErr.message);
  }
};

const run = async () => {
  console.log('\n============================================================');
  console.log('--- STARTING PHASE 9 SECURITY REGRESSION & RACE TEST ---');
  console.log('============================================================\n');

  await mongoose.connect(
    process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/omniva_saas',
    { serverSelectionTimeoutMS: 15000 }
  );
  const server = app.listen(PORT, '127.0.0.1');
  await once(server, 'listening');

  try {
    // ---------------------------------------------------------------------
    // 1. Outbound URL guard primitives
    // ---------------------------------------------------------------------
    const privateAddresses = [
      '127.0.0.1',
      '10.1.2.3',
      '172.16.0.1',
      '192.168.1.1',
      '169.254.169.254',
      '0.0.0.0',
      '100.64.0.1',
      '::1',
      'fc00::1',
      'fe80::1',
      '::ffff:127.0.0.1',
    ];
    check(
      'SSRF guard blocks loopback/RFC1918/link-local/CGNAT/IPv6 private addresses',
      privateAddresses.every((ip) => isPrivateAddress(ip)),
      privateAddresses.filter((ip) => !isPrivateAddress(ip)).join(', ')
    );
    check('SSRF guard allows a public IP literal', !isPrivateAddress('8.8.8.8'));

    let directBlocked = false;
    try {
      await assertSafeOutboundUrl('http://127.0.0.1:5097/ssrf');
    } catch {
      directBlocked = true;
    }
    check('SSRF guard rejects a loopback webhook URL', directBlocked);

    // ---------------------------------------------------------------------
    // 2. Live SSRF attempt through the automation execution endpoint
    // ---------------------------------------------------------------------
    const ssrfTenant = await createTenant('ssrf');
    const ssrfOwner = await createOwner(ssrfTenant, 'ssrf');
    const ssrfStaff = await createStaff(ssrfTenant, 'ssrf', 'ORDER_MANAGER');
    const ssrfToken = await login(ssrfOwner.email, 'ProbePass123!');
    const ssrfStaffToken = await login(ssrfStaff.email, 'ProbePass123!');

    const probeCapi = `probe-capi-${stamp}-secret`;
    const probeWaToken = `probe-wa-${stamp}-secret`;
    const probePaymentSecret = `probe-payment-${stamp}-secret`;
    const probeWebhookSecret = `probe-webhook-${stamp}-secret`;
    ssrfTenant.settings.metaCapiToken = probeCapi;
    ssrfTenant.integrations.meta.capiToken = probeCapi;
    ssrfTenant.integrations.whatsapp.accessToken = probeWaToken;
    ssrfTenant.integrations.payment.keySecret = probePaymentSecret;
    ssrfTenant.integrations.webhooks.secret = probeWebhookSecret;
    await ssrfTenant.save();

    const rawSecretTenant = await Tenant.collection.findOne({ _id: ssrfTenant._id });
    check(
      'Tenant integration credentials are encrypted at rest with AES-GCM',
      rawSecretTenant?.settings?.metaCapiToken?.startsWith('enc:gcm:') &&
        rawSecretTenant?.integrations?.whatsapp?.accessToken?.startsWith('enc:gcm:') &&
        !JSON.stringify(rawSecretTenant).includes(probeCapi) &&
        !JSON.stringify(rawSecretTenant).includes(probeWaToken),
      'raw tenant document contains a plaintext credential'
    );

    const hydratedSecretTenant = await Tenant.findById(ssrfTenant._id);
    check(
      'Tenant secret getters decrypt credentials for server-side integrations',
      hydratedSecretTenant?.settings?.metaCapiToken === probeCapi &&
        hydratedSecretTenant?.integrations?.whatsapp?.accessToken === probeWaToken,
      'decrypted credential did not match the stored value'
    );

    const ownerMeRes = await request('GET', '/auth/me', { token: ssrfToken });
    const ownerMeJson = JSON.stringify(ownerMeRes.data || {});
    check(
      'Owner /auth/me masks tenant integration credentials',
      ownerMeRes.status === 200 &&
        !ownerMeJson.includes(probeCapi) &&
        !ownerMeJson.includes(probeWaToken) &&
        String(ownerMeRes.data?.tenant?.settings?.metaCapiToken || '').includes('••••'),
      'owner profile leaked a credential'
    );

    const staffMeRes = await request('GET', '/auth/me', { token: ssrfStaffToken });
    const staffMeJson = JSON.stringify(staffMeRes.data || {});
    check(
      'Staff /auth/me masks tenant integration credentials',
      staffMeRes.status === 200 &&
        !staffMeJson.includes(probeCapi) &&
        !staffMeJson.includes(probeWaToken),
      'staff profile leaked a credential'
    );

    let ssrfHit = false;
    ssrfListener = http.createServer((req, res) => {
      ssrfHit = true;
      res.statusCode = 200;
      res.end('should-not-be-reached');
    });
    ssrfListener.listen(5097, '127.0.0.1');
    await once(ssrfListener, 'listening');

    const maliciousRule = await request('POST', '/automations/rules', {
      token: ssrfToken,
      body: {
        name: 'Probe SSRF Rule',
        trigger: 'ORDER_CREATED',
        action: {
          type: 'OUTBOUND_WEBHOOK',
          target: 'http://127.0.0.1:5097/ssrf',
          template: 'probe',
        },
      },
    });
    check('Automation rule can be stored for probe', maliciousRule.status === 201);

    // The public test endpoint is intentionally a dry run and never dispatches.
    // Call the engine directly here to verify the SSRF guard on a real dispatch.
    const triggerResults = await triggerAutomation({
      businessId: ssrfTenant._id,
      trigger: 'ORDER_CREATED',
      entityType: 'ORDER',
      entityId: 'PROBE-SSRF',
      data: { customerName: 'Probe' },
      targetRuleId: maliciousRule.data?.data?._id,
      dryRun: false,
    });
    await new Promise((resolve) => setTimeout(resolve, 150));
    check(
      'Automation engine refuses to fetch a loopback webhook and records FAILED',
      triggerResults?.[0]?.status === 'FAILED',
      JSON.stringify(triggerResults)
    );
    check('Loopback listener was never reached', ssrfHit === false);

    const failedLog = await AutomationLog.findOne({
      businessId: ssrfTenant._id,
      ruleId: maliciousRule.data?.data?._id,
    }).sort({ createdAt: -1 });
    check(
      'SSRF failure is logged with a private/reserved-network reason',
      Boolean(failedLog) &&
        failedLog.status === 'FAILED' &&
        /private|reserved|local/i.test(failedLog.errorMessage || ''),
      failedLog?.errorMessage || 'no log'
    );

    // ---------------------------------------------------------------------
    // 3. SUPER_STAFF cannot read merchant integration secrets
    // ---------------------------------------------------------------------
    const superStaff = await User.create({
      name: 'Probe Support',
      email: `probe-superstaff-${stamp}@example.com`,
      password: 'ProbePass123!',
      role: 'SUPER_STAFF',
    });
    createdUserIds.push(superStaff._id);
    const superStaffToken = await login(superStaff.email, 'ProbePass123!');
    const secretRes = await request(
      'GET',
      `/admin/merchants/${ssrfTenant._id}/integrations`,
      { token: superStaffToken }
    );
    check(
      'SUPER_STAFF receives 403 when reading merchant integration secrets',
      secretRes.status === 403,
      `status ${secretRes.status}`
    );
    const merchantListRes = await request('GET', '/admin/merchants', {
      token: superStaffToken,
    });
    const listedTenant = merchantListRes.data?.data?.find(
      (t) => String(t._id) === String(ssrfTenant._id)
    );
    check(
      'Merchant list omits integration credentials and CAPI tokens',
      merchantListRes.status === 200 &&
        Boolean(listedTenant) &&
        !Object.prototype.hasOwnProperty.call(listedTenant, 'integrations') &&
        !listedTenant.settings?.metaCapiToken,
      merchantListRes.data?.message || 'secrets leaked in merchant list'
    );

    // ---------------------------------------------------------------------
    // 3b. SUPER_ADMIN admin data endpoints and profile authorization
    // ---------------------------------------------------------------------
    const superAdmin = await User.create({
      name: 'Probe Super Admin',
      email: `probe-superadmin-${stamp}@example.com`,
      password: 'ProbePass123!',
      role: 'SUPER_ADMIN',
    });
    createdUserIds.push(superAdmin._id);
    const superAdminToken = await login(superAdmin.email, 'ProbePass123!');

    const adminIntegrationsRes = await request(
      'GET',
      `/admin/merchants/${ssrfTenant._id}/integrations`,
      { token: superAdminToken }
    );
    const adminIntegrationsJson = JSON.stringify(adminIntegrationsRes.data || {});
    check(
      'SUPER_ADMIN integration endpoint masks stored credentials',
      adminIntegrationsRes.status === 200 &&
        !adminIntegrationsJson.includes(probeCapi) &&
        !adminIntegrationsJson.includes(probeWaToken) &&
        String(adminIntegrationsRes.data?.integrations?.meta?.capiToken || '').includes('••••'),
      adminIntegrationsRes.data?.message || 'admin integration endpoint leaked a credential'
    );

    const maskedRoundTrip = await request(
      'PUT',
      `/admin/merchants/${ssrfTenant._id}/integrations`,
      {
        token: superAdminToken,
        body: { integrations: adminIntegrationsRes.data?.integrations || {} },
      }
    );
    const tenantAfterMaskedRoundTrip = await Tenant.findById(ssrfTenant._id);
    check(
      'Masked admin integration round-trip preserves existing credentials',
      maskedRoundTrip.status === 200 &&
        tenantAfterMaskedRoundTrip?.settings?.metaCapiToken === probeCapi &&
        tenantAfterMaskedRoundTrip?.integrations?.whatsapp?.accessToken === probeWaToken,
      maskedRoundTrip.data?.message || 'masked save overwrote a stored credential'
    );

    const rotatedCapi = `probe-capi-rotated-${stamp}`;
    const rotateRes = await request(
      'PUT',
      `/admin/merchants/${ssrfTenant._id}/integrations`,
      {
        token: superAdminToken,
        body: { integrations: { meta: { capiToken: rotatedCapi } } },
      }
    );
    const tenantAfterRotation = await Tenant.findById(ssrfTenant._id);
    check(
      'Admin credential rotation updates only the targeted secret',
      rotateRes.status === 200 &&
        tenantAfterRotation?.settings?.metaCapiToken === rotatedCapi &&
        tenantAfterRotation?.integrations?.meta?.capiToken === rotatedCapi &&
        tenantAfterRotation?.integrations?.whatsapp?.accessToken === probeWaToken,
      rotateRes.data?.message || 'credential rotation was not isolated'
    );

    const metaSettingsRes = await request('GET', '/meta/settings', { token: ssrfToken });
    const metaSettingsJson = JSON.stringify(metaSettingsRes.data || {});
    check(
      'Meta settings never expose the platform webhook verify token',
      metaSettingsRes.status === 200 &&
        !Object.prototype.hasOwnProperty.call(
          metaSettingsRes.data?.settings || {},
          'verifyToken'
        ) &&
        !metaSettingsJson.includes(PROBE_META_VERIFY_TOKEN) &&
        metaSettingsRes.data?.settings?.verifyTokenConfigured === true,
      metaSettingsRes.data?.message || 'verify token was exposed'
    );

    const maskedMetaSaveRes = await request('PUT', '/meta/settings', {
      token: ssrfToken,
      body: { metaCapiToken: '••••••••' },
    });
    const tenantAfterMaskedMetaSave = await Tenant.findById(ssrfTenant._id);
    check(
      'Masked Meta settings save keeps the existing CAPI token',
      maskedMetaSaveRes.status === 200 &&
        tenantAfterMaskedMetaSave?.settings?.metaCapiToken === rotatedCapi,
      maskedMetaSaveRes.data?.message || 'masked Meta save overwrote the token'
    );

    const metaIntegrationRes = await request('GET', '/meta/integration', {
      token: ssrfToken,
    });
    const metaIntegrationJson = JSON.stringify(metaIntegrationRes.data || {});
    check(
      'Meta integration status never exposes the platform webhook verify token',
      metaIntegrationRes.status === 200 &&
        !Object.prototype.hasOwnProperty.call(
          metaIntegrationRes.data?.webhookInfo || {},
          'verifyToken'
        ) &&
        !metaIntegrationJson.includes(PROBE_META_VERIFY_TOKEN),
      metaIntegrationRes.data?.message || 'verify token was exposed'
    );

    const plansRes = await request('GET', '/admin/plans', { token: superAdminToken });
    check(
      'SUPER_ADMIN can load the backend plan catalog',
      plansRes.status === 200 && Boolean(plansRes.data?.data?.PRO),
      plansRes.data?.message || 'missing plan catalog'
    );

    const statsRes = await request('GET', '/admin/stats', { token: superAdminToken });
    check(
      'Platform stats omit synthetic health claims and expose subscription count',
      statsRes.status === 200 &&
        typeof statsRes.data?.data?.activeSubscriptions === 'number' &&
        !Object.prototype.hasOwnProperty.call(statsRes.data?.data || {}, 'systemHealth'),
      JSON.stringify(statsRes.data?.data || {})
    );

    const adminStaffRes = await request(
      'GET',
      `/admin/merchants/${ssrfTenant._id}/staff`,
      { token: superAdminToken }
    );
    check(
      'SUPER_ADMIN can list real merchant staff accounts',
      adminStaffRes.status === 200 && Array.isArray(adminStaffRes.data?.data),
      adminStaffRes.data?.message || 'staff list missing'
    );

    const adminUsageRes = await request(
      'GET',
      `/admin/merchants/${ssrfTenant._id}/usage`,
      { token: superAdminToken }
    );
    check(
      'SUPER_ADMIN can read current-month quota usage',
      adminUsageRes.status === 200 &&
        adminUsageRes.data?.data?.limits?.maxMonthlyOrders > 0 &&
        typeof adminUsageRes.data?.data?.usage?.ordersThisMonth === 'number',
      adminUsageRes.data?.message || 'usage missing'
    );

    const renamed = `Probe Renamed ${stamp}`;
    const profileRes = await request(
      'PATCH',
      `/admin/merchants/${ssrfTenant._id}`,
      { token: superAdminToken, body: { businessName: renamed } }
    );
    const reloadedTenant = await Tenant.findById(ssrfTenant._id).select('businessName');
    check(
      'SUPER_ADMIN profile update persists the tenant name',
      profileRes.status === 200 && reloadedTenant?.businessName === renamed,
      profileRes.data?.message || 'profile update not persisted'
    );

    const staffProfileRes = await request(
      'PATCH',
      `/admin/merchants/${ssrfTenant._id}`,
      { token: superStaffToken, body: { businessName: 'Unauthorized Rename' } }
    );
    check(
      'SUPER_STAFF cannot update merchant profiles',
      staffProfileRes.status === 403,
      `status ${staffProfileRes.status}`
    );

    // ---------------------------------------------------------------------
    // 4. Razorpay webhook amount validation + valid captured path
    // ---------------------------------------------------------------------
    const probeOrder = await Order.create({
      businessId: ssrfTenant._id,
      orderNumber: `PROBE-RZP-${stamp}`,
      customerName: 'Probe Customer',
      customerPhone: '9876501234',
      shippingAddress: {
        street: '1 Probe Street',
        city: 'Probe City',
        state: 'Probe State',
        pincode: '110001',
      },
      items: [
        {
          productId: new mongoose.Types.ObjectId(),
          name: 'Probe Item',
          price: 100,
          quantity: 1,
          subtotal: 100,
        },
      ],
      subtotal: 100,
      shippingFee: 0,
      totalAmount: 100,
      paymentMethod: 'ONLINE',
      paymentStatus: 'PENDING',
      orderStatus: 'NEW',
    });
    createdOrderIds.push(probeOrder._id);

    const webhookSecret =
      process.env.RAZORPAY_WEBHOOK_SECRET || 'omniva_rzp_secret_2026';
    const sendWebhook = async (amount) => {
      const body = JSON.stringify({
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: `pay_probe_${stamp}`,
              order_id: `order_probe_${stamp}`,
              amount,
              currency: 'INR',
              status: 'captured',
              notes: {
                orderNumber: probeOrder.orderNumber,
                businessId: String(ssrfTenant._id),
              },
            },
          },
        },
      });
      const signature = crypto
        .createHmac('sha256', webhookSecret)
        .update(body)
        .digest('hex');
      const res = await fetch(`${BASE}/webhooks/razorpay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-razorpay-signature': signature,
        },
        body,
      });
      return { status: res.status, data: await res.json().catch(() => null) };
    };

    const mismatch = await sendWebhook(100);
    const afterMismatch = await Order.findById(probeOrder._id);
    check(
      'Webhook rejects an amount that does not match order total',
      mismatch.status === 400,
      `status ${mismatch.status}`
    );
    check(
      'Order remains PENDING after amount mismatch',
      afterMismatch.paymentStatus === 'PENDING',
      afterMismatch.paymentStatus
    );

    const validCapture = await sendWebhook(10000);
    const afterValid = await Order.findById(probeOrder._id);
    check(
      'Webhook accepts the exact captured amount',
      validCapture.status === 200,
      `status ${validCapture.status}`
    );
    check(
      'Order becomes PAID after valid captured webhook',
      afterValid.paymentStatus === 'PAID',
      afterValid.paymentStatus
    );

    // ---------------------------------------------------------------------
    // 5. CRM ONLINE lead conversion must remain unpaid
    // ---------------------------------------------------------------------
    const lead = await Lead.create({
      businessId: ssrfTenant._id,
      name: 'Probe Lead',
      phone: '9876501235',
      source: 'MANUAL',
      status: 'NEW',
    });
    createdLeadIds.push(lead._id);
    const convertRes = await request('POST', `/crm/leads/${lead._id}/convert-to-order`, {
      token: ssrfToken,
      body: {
        paymentMethod: 'ONLINE',
        productName: 'Probe Converted Item',
        price: 250,
        quantity: 1,
        street: '1 Probe Street',
        city: 'Probe City',
        pincode: '110001',
      },
    });
    check(
      'CRM ONLINE lead conversion creates an unpaid PENDING order',
      convertRes.status === 201 &&
        convertRes.data?.data?.order?.paymentStatus === 'PENDING',
      `status ${convertRes.status}, paymentStatus ${convertRes.data?.data?.order?.paymentStatus}`
    );
    if (convertRes.data?.data?.order?._id) {
      createdOrderIds.push(convertRes.data.data.order._id);
    }

    // ---------------------------------------------------------------------
    // 6. Staff seat quota on STARTER
    // ---------------------------------------------------------------------
    const quotaTenant = await createTenant('quota', 'STARTER');
    const quotaOwner = await createOwner(quotaTenant, 'quota');
    const quotaToken = await login(quotaOwner.email, 'ProbePass123!');

    const firstStaff = await request('POST', '/auth/staff', {
      token: quotaToken,
      body: {
        name: 'Probe Staff One',
        email: `probe-staff-one-${stamp}@example.com`,
        password: 'ProbePass123!',
        role: 'SUPPORT_STAFF',
      },
    });
    check(
      'First staff member is allowed on STARTER (owner + 1 seat)',
      firstStaff.status === 201,
      `status ${firstStaff.status}`
    );

    const secondStaff = await request('POST', '/auth/staff', {
      token: quotaToken,
      body: {
        name: 'Probe Staff Two',
        email: `probe-staff-two-${stamp}@example.com`,
        password: 'ProbePass123!',
        role: 'SUPPORT_STAFF',
      },
    });
    check(
      'Second staff member is blocked by STARTER seat quota',
      secondStaff.status === 403 &&
        secondStaff.data?.code === 'QUOTA_EXCEEDED',
      `status ${secondStaff.status}, code ${secondStaff.data?.code}`
    );

    // ---------------------------------------------------------------------
    // 6b. Staff update/delete endpoints are tenant-scoped
    // ---------------------------------------------------------------------
    const staffTenantA = await createTenant('staff-scope-a');
    const staffTenantB = await createTenant('staff-scope-b');
    const staffOwnerA = await createOwner(staffTenantA, 'staff-scope-a');
    const staffOwnerB = await createOwner(staffTenantB, 'staff-scope-b');
    const scopedStaff = await createStaff(staffTenantA, 'scope', 'SUPPORT_STAFF');
    const staffTokenA = await login(staffOwnerA.email, 'ProbePass123!');
    const staffTokenB = await login(staffOwnerB.email, 'ProbePass123!');

    const crossTenantUpdate = await request('PUT', `/auth/staff/${scopedStaff._id}`, {
      token: staffTokenB,
      body: { isActive: false, name: 'Cross-tenant change' },
    });
    const staffAfterCrossUpdate = await User.findById(scopedStaff._id);
    check(
      'Another tenant cannot deactivate a staff account',
      crossTenantUpdate.status === 404 &&
        staffAfterCrossUpdate?.isActive === true &&
        staffAfterCrossUpdate?.name !== 'Cross-tenant change',
      `status=${crossTenantUpdate.status}, active=${staffAfterCrossUpdate?.isActive}`
    );

    const crossTenantDelete = await request('DELETE', `/auth/staff/${scopedStaff._id}`, {
      token: staffTokenB,
    });
    const staffAfterCrossDelete = await User.findById(scopedStaff._id);
    check(
      'Another tenant cannot delete a staff account',
      crossTenantDelete.status === 404 && Boolean(staffAfterCrossDelete),
      `status=${crossTenantDelete.status}, stillExists=${Boolean(staffAfterCrossDelete)}`
    );

    const ownerUpdate = await request('PUT', `/auth/staff/${scopedStaff._id}`, {
      token: staffTokenA,
      body: {
        name: 'Scoped Staff Updated',
        role: 'ORDER_MANAGER',
        customPermissions: ['orders.read', 'orders.update'],
      },
    });
    const staffAfterOwnerUpdate = await User.findById(scopedStaff._id);
    check(
      'The owning tenant can update staff role and permissions',
      ownerUpdate.status === 200 &&
        staffAfterOwnerUpdate?.name === 'Scoped Staff Updated' &&
        staffAfterOwnerUpdate?.role === 'ORDER_MANAGER' &&
        staffAfterOwnerUpdate?.customPermissions?.includes('orders.update'),
      `status=${ownerUpdate.status}, role=${staffAfterOwnerUpdate?.role}`
    );

    const ownerDelete = await request('DELETE', `/auth/staff/${scopedStaff._id}`, {
      token: staffTokenA,
    });
    const staffAfterOwnerDelete = await User.findById(scopedStaff._id);
    check(
      'The owning tenant can delete its staff account',
      ownerDelete.status === 200 && staffAfterOwnerDelete === null,
      `status=${ownerDelete.status}, stillExists=${Boolean(staffAfterOwnerDelete)}`
    );

    // ---------------------------------------------------------------------
    // 7. Concurrent checkout cannot leak stock on partial decrement failure
    // ---------------------------------------------------------------------
    const stockTenant = await createTenant('stock');
    const productA = await Product.create({
      businessId: stockTenant._id,
      name: 'Probe Stock A',
      slug: `probe-stock-a-${stamp}`,
      price: 100,
      stockQuantity: 100,
      trackQuantity: true,
      isAvailable: true,
    });
    const productB = await Product.create({
      businessId: stockTenant._id,
      name: 'Probe Stock B',
      slug: `probe-stock-b-${stamp}`,
      price: 100,
      stockQuantity: 1,
      trackQuantity: true,
      isAvailable: true,
    });
    createdProductIds.push(productA._id, productB._id);

    const attempts = Array.from({ length: 8 }, (_, i) =>
      request('POST', `/public/store/${stockTenant.slug}/orders`, {
        body: {
          customerName: `Probe Checkout ${i}`,
          customerPhone: '9876501236',
          shippingAddress: {
            street: '1 Probe Street',
            city: 'Probe City',
            state: 'Probe State',
            pincode: '110001',
          },
          items: [
            { productId: String(productA._id), quantity: 1 },
            { productId: String(productB._id), quantity: 1 },
          ],
          paymentMethod: 'COD',
        },
      })
    );
    const attemptResults = await Promise.all(attempts);
    const successCount = attemptResults.filter((r) => r.status === 201).length;
    const afterA = await Product.findById(productA._id);
    const afterB = await Product.findById(productB._id);

    check(
      'Concurrent checkouts sell the single unit of item B at most once',
      successCount <= 1 && afterB.stockQuantity >= 0,
      `successes=${successCount}, B=${afterB.stockQuantity}`
    );
    check(
      'Failed checkout restores item A stock (no partial-decrement leak)',
      afterA.stockQuantity === 100 - successCount,
      `expected A=${100 - successCount}, got ${afterA.stockQuantity}, successes=${successCount}`
    );
    check(
      'Item B stock matches successful checkouts',
      afterB.stockQuantity === 1 - successCount,
      `expected B=${1 - successCount}, got ${afterB.stockQuantity}`
    );

    // ---------------------------------------------------------------------
    // 8. Concurrent coupon redemption cannot exceed usageLimit
    // ---------------------------------------------------------------------
    const couponProduct = await Product.create({
      businessId: stockTenant._id,
      name: 'Probe Coupon Product',
      slug: `probe-coupon-product-${stamp}`,
      price: 100,
      stockQuantity: 100,
      trackQuantity: true,
      isAvailable: true,
    });
    createdProductIds.push(couponProduct._id);
    const coupon = await Coupon.create({
      businessId: stockTenant._id,
      code: `PROBE${stamp}`.toUpperCase(),
      title: 'Probe single-use coupon',
      discountType: 'FLAT',
      discountValue: 10,
      usageLimit: 1,
      isActive: true,
    });

    const couponAttempts = Array.from({ length: 5 }, (_, i) =>
      request('POST', `/public/store/${stockTenant.slug}/orders`, {
        body: {
          customerName: `Probe Coupon Checkout ${i}`,
          customerPhone: '9876501237',
          shippingAddress: {
            street: '1 Probe Street',
            city: 'Probe City',
            state: 'Probe State',
            pincode: '110001',
          },
          items: [{ productId: String(couponProduct._id), quantity: 1 }],
          paymentMethod: 'COD',
          couponCode: coupon.code,
        },
      })
    );
    const couponResults = await Promise.all(couponAttempts);
    const couponSuccesses = couponResults.filter((r) => r.status === 201).length;
    const couponAfter = await Coupon.findById(coupon._id);
    const couponProductAfter = await Product.findById(couponProduct._id);
    check(
      'Concurrent coupon redemption respects usageLimit=1',
      couponSuccesses === 1 && couponAfter.usageCount === 1,
      `successes=${couponSuccesses}, usageCount=${couponAfter.usageCount}`
    );
    check(
      'Failed coupon redemptions restore stock',
      couponProductAfter.stockQuantity === 100 - couponSuccesses,
      `expected=${100 - couponSuccesses}, got=${couponProductAfter.stockQuantity}`
    );

    // ---------------------------------------------------------------------
    // 9. Public storefront never exposes tenant secrets or cost prices
    // ---------------------------------------------------------------------
    const leakTenant = await createTenant('leak');
    leakTenant.settings = {
      ...(leakTenant.settings || {}),
      metaCapiToken: `probe-capi-secret-${stamp}`,
      metaPixelId: `probe-pixel-${stamp}`,
    };
    await leakTenant.save();
    const leakProduct = await Product.create({
      businessId: leakTenant._id,
      name: 'Probe Leak Product',
      slug: `probe-leak-product-${stamp}`,
      description: 'Probe product',
      price: 299,
      costPrice: 111,
      stockQuantity: 10,
      trackQuantity: true,
      isAvailable: true,
      variants: [
        {
          name: 'Probe 500g',
          price: 299,
          costPrice: 99,
          stockQuantity: 10,
        },
      ],
    });
    createdProductIds.push(leakProduct._id);

    const publicStoreRes = await request('GET', `/public/store/${leakTenant.slug}`);
    const publicStoreJson = JSON.stringify(publicStoreRes.data || {});
    check(
      'Public storefront does not expose metaCapiToken',
      publicStoreRes.status === 200 && !publicStoreJson.includes('probe-capi-secret')
    );
    check(
      'Public storefront does not expose product or variant cost prices',
      !publicStoreJson.includes('costPrice') && !publicStoreJson.includes('"111"')
    );

    const unknownStoreRes = await request('GET', `/public/store/no-such-store-${stamp}`);
    const unknownInquiryRes = await request('POST', `/public/store/no-such-store-${stamp}/inquire`, {
      body: { name: 'Probe Unknown', phone: '9876501240', source: 'WEBSITE' },
    });
    check(
      'Unknown storefront returns 404 and never fabricates a demo inquiry',
      unknownStoreRes.status === 404 &&
        unknownInquiryRes.status === 404 &&
        !JSON.stringify(unknownInquiryRes.data).includes('demo_lead_')
    );

    // ---------------------------------------------------------------------
    // 10. Public checkout idempotency prevents duplicate orders and stock use
    // ---------------------------------------------------------------------
    const idemTenant = await createTenant('idem');
    const idemProduct = await Product.create({
      businessId: idemTenant._id,
      name: 'Probe Idempotent Product',
      slug: `probe-idem-product-${stamp}`,
      price: 199,
      stockQuantity: 5,
      trackQuantity: true,
      isAvailable: true,
    });
    createdProductIds.push(idemProduct._id);
    const idempotencyKey = `probe-idem-${stamp}`;
    const idemPayload = {
      customerName: 'Probe Idem Customer',
      customerPhone: '9876501241',
      shippingAddress: {
        street: '1 Probe Street',
        city: 'Probe City',
        state: 'Probe State',
        pincode: '110001',
      },
      items: [{ productId: String(idemProduct._id), quantity: 1 }],
      paymentMethod: 'COD',
    };
    const idemFirst = await request('POST', `/public/store/${idemTenant.slug}/orders`, {
      body: idemPayload,
      headers: { 'X-Idempotency-Key': idempotencyKey },
    });
    const idemSecond = await request('POST', `/public/store/${idemTenant.slug}/orders`, {
      body: idemPayload,
      headers: { 'X-Idempotency-Key': idempotencyKey },
    });
    const idemProductAfter = await Product.findById(idemProduct._id);
    const idemOrderCount = await Order.countDocuments({
      businessId: idemTenant._id,
      idempotencyKey,
    });
    check(
      'Repeated checkout with the same idempotency key returns the same order',
      idemFirst.status === 201 &&
        idemSecond.status === 200 &&
        idemFirst.data?.data?.orderNumber === idemSecond.data?.data?.orderNumber &&
        idemOrderCount === 1,
      `first=${idemFirst.status}, second=${idemSecond.status}, count=${idemOrderCount}`
    );
    check(
      'Repeated checkout decrements stock only once',
      idemProductAfter.stockQuantity === 4,
      `expected stock 4, got ${idemProductAfter.stockQuantity}`
    );

    // ---------------------------------------------------------------------
    // 11. Merchant plan changes require platform approval; quota windows survive
    // ---------------------------------------------------------------------
    const planTenant = await createTenant('plan', 'STARTER');
    const planOwner = await createOwner(planTenant, 'plan');
    const planStaff = await createStaff(planTenant, 'plan', 'ORDER_MANAGER');
    const staffToken = await login(planStaff.email, 'ProbePass123!');
    const ownerToken = await login(planOwner.email, 'ProbePass123!');
    const oldPeriodStart = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
    planTenant.subscription = {
      status: 'ACTIVE',
      billingCycle: 'MONTHLY',
      currentPeriodStart: oldPeriodStart,
      currentPeriodEnd: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
    };
    await planTenant.save();

    const staffUpgrade = await request('POST', '/subscriptions/upgrade', {
      token: staffToken,
      body: { planTier: 'PRO' },
    });
    const ownerUpgrade = await request('POST', '/subscriptions/upgrade', {
      token: ownerToken,
      body: { planTier: 'PRO' },
    });
    const planAfter = await Tenant.findById(planTenant._id);
    check(
      'Ordinary staff cannot upgrade the subscription plan',
      staffUpgrade.status === 403
    );
    check(
      'Merchant owner cannot self-upgrade before billing is integrated',
      ownerUpgrade.status === 403 &&
        planAfter.planTier === 'STARTER' &&
        new Date(planAfter.subscription.currentPeriodStart).getTime() === oldPeriodStart.getTime(),
      `status=${ownerUpgrade.status}, plan=${planAfter.planTier}, start=${planAfter.subscription?.currentPeriodStart}`
    );

    // ---------------------------------------------------------------------
    // 12. CRM conversion reserves stock and cancellation restores it once
    // ---------------------------------------------------------------------
    const crmTenant = await createTenant('crm');
    const crmOwner = await createOwner(crmTenant, 'crm');
    const crmToken = await login(crmOwner.email, 'ProbePass123!');
    const crmProduct = await Product.create({
      businessId: crmTenant._id,
      name: 'Probe CRM Product',
      slug: `probe-crm-product-${stamp}`,
      price: 250,
      stockQuantity: 2,
      trackQuantity: true,
      isAvailable: true,
    });
    createdProductIds.push(crmProduct._id);
    const crmLead = await Lead.create({
      businessId: crmTenant._id,
      name: 'Probe CRM Lead',
      phone: '9876501242',
      source: 'MANUAL',
      status: 'QUALIFIED',
      budget: 250,
    });
    createdLeadIds.push(crmLead._id);

    const crmConvertRes = await request('POST', `/crm/leads/${crmLead._id}/convert-to-order`, {
      token: crmToken,
      body: {
        productId: String(crmProduct._id),
        quantity: 1,
        paymentMethod: 'COD',
        street: '2 Probe Street',
        city: 'Probe City',
        pincode: '110001',
      },
    });
    const crmProductAfterConvert = await Product.findById(crmProduct._id);
    const convertedOrder = crmConvertRes.data?.data?.order;
    check(
      'CRM lead conversion reserves real inventory',
      crmConvertRes.status === 201 &&
        convertedOrder?.stockDecremented === true &&
        crmProductAfterConvert.stockQuantity === 1,
      `status=${crmConvertRes.status}, stock=${crmProductAfterConvert.stockQuantity}`
    );

    const cancelRes = await request('PATCH', `/orders/${convertedOrder._id}/status`, {
      token: crmToken,
      body: { orderStatus: 'CANCELLED' },
    });
    const crmProductAfterCancel = await Product.findById(crmProduct._id);
    check(
      'Cancelling a converted CRM order restores inventory exactly once',
      cancelRes.status === 200 && crmProductAfterCancel.stockQuantity === 2,
      `status=${cancelRes.status}, stock=${crmProductAfterCancel.stockQuantity}`
    );

    // ---------------------------------------------------------------------
    // 13. Concurrent cancellation restores stock once
    // ---------------------------------------------------------------------
    const cancelTenant = await createTenant('cancel');
    const cancelOwner = await createOwner(cancelTenant, 'cancel');
    const cancelToken = await login(cancelOwner.email, 'ProbePass123!');
    const cancelProduct = await Product.create({
      businessId: cancelTenant._id,
      name: 'Probe Cancel Product',
      slug: `probe-cancel-product-${stamp}`,
      price: 100,
      stockQuantity: 5,
      trackQuantity: true,
      isAvailable: true,
    });
    createdProductIds.push(cancelProduct._id);

    const cancelOrderRes = await request('POST', `/public/store/${cancelTenant.slug}/orders`, {
      body: {
        customerName: 'Probe Cancel Customer',
        customerPhone: '9876501243',
        shippingAddress: {
          street: '1 Probe Street',
          city: 'Probe City',
          state: 'Probe State',
          pincode: '110001',
        },
        items: [{ productId: String(cancelProduct._id), quantity: 2 }],
        paymentMethod: 'COD',
      },
    });
    const cancelOrder = cancelOrderRes.data?.data;
    const cancelledAttempts = await Promise.all([
      request('PATCH', `/orders/${cancelOrder._id}/status`, {
        token: cancelToken,
        body: { orderStatus: 'CANCELLED' },
      }),
      request('PATCH', `/orders/${cancelOrder._id}/status`, {
        token: cancelToken,
        body: { orderStatus: 'CANCELLED' },
      }),
    ]);
    const cancelProductAfter = await Product.findById(cancelProduct._id);
    const cancellationWins = cancelledAttempts.filter((r) => r.status === 200).length;
    check(
      'Concurrent cancellation restores stock exactly once',
      cancelOrderRes.status === 201 &&
        cancellationWins === 1 &&
        cancelProductAfter.stockQuantity === 5,
      `order=${cancelOrderRes.status}, wins=${cancellationWins}, stock=${cancelProductAfter.stockQuantity}`
    );

    // ---------------------------------------------------------------------
    // 14. A captured payment never quietly reopens a cancelled order
    // ---------------------------------------------------------------------
    const cancelWebhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'omniva_rzp_secret_2026';
    const cancelledWebhookBody = {
      event: 'order.paid',
      payload: {
        payment: {
          entity: {
            id: `pay_probe_cancel_${stamp}`,
            amount: Math.round(Number(cancelOrder.totalAmount) * 100),
            currency: 'INR',
            status: 'captured',
            notes: {
              orderNumber: cancelOrder.orderNumber,
              businessId: String(cancelTenant._id),
            },
          },
        },
      },
    };
    const cancelledRawBody = JSON.stringify(cancelledWebhookBody);
    const cancelledSignature = crypto
      .createHmac('sha256', cancelWebhookSecret)
      .update(cancelledRawBody)
      .digest('hex');
    const cancelledWebhookRes = await fetch(`${BASE}/webhooks/razorpay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-razorpay-signature': cancelledSignature,
      },
      body: cancelledRawBody,
    });
    const cancelledOrderAfter = await Order.findById(cancelOrder._id);
    check(
      'Captured payment on a cancelled order does not reopen it',
      cancelledWebhookRes.status === 200 &&
        cancelledOrderAfter.orderStatus === 'CANCELLED' &&
        cancelledOrderAfter.paymentStatus === 'PAID' &&
        cancelledOrderAfter.timeline.some((entry) => entry.note.includes('Manual refund')),
      `status=${cancelledWebhookRes.status}, order=${cancelledOrderAfter.orderStatus}, payment=${cancelledOrderAfter.paymentStatus}`
    );

    // ---------------------------------------------------------------------
    // 15. Unknown orders never receive a synthetic in-memory success
    // ---------------------------------------------------------------------
    const unknownOrderRes = await request(
      'PATCH',
      '/orders/000000000000000000000000/status',
      {
        token: cancelToken,
        body: { orderStatus: 'SHIPPED', note: 'Unknown-order probe' },
      }
    );
    check(
      'Unknown order ids return 404 instead of a synthetic success',
      unknownOrderRes.status === 404 && unknownOrderRes.data?.success === false,
      `status=${unknownOrderRes.status}, message=${unknownOrderRes.data?.message || ''}`
    );

  } finally {
    await cleanup();
    if (ssrfListener && ssrfListener.listening) {
      ssrfListener.close();
      await once(ssrfListener, 'close');
    }
    await new Promise((resolve) => server.close(resolve));
    await mongoose.disconnect();
  }

  console.log(`\nPHASE 9 RESULT: ${passed} PASSED, ${failed} FAILED`);
  if (failed === 0) {
    console.log(`\n🌟 ALL ${passed} SECURITY REGRESSION TESTS PASSED 100%! 🌟\n`);
  } else {
    process.exitCode = 1;
  }
};

run().catch(async (err) => {
  console.error('\n[Deep Probe Error]', err);
  await cleanup();
  try {
    await mongoose.disconnect();
  } catch {}
  process.exitCode = 1;
});
