process.env.NODE_ENV = 'test';
process.env.DISABLE_RATE_LIMIT = 'true';
process.env.META_APP_SECRET = 'phase11-test-meta-app-secret';
process.env.META_WEBHOOK_VERIFY_TOKEN = 'phase11-test-meta-verify-token';

const path = require('path');
const http = require('http');
const { once } = require('events');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const mongoose = require('mongoose');
const { app } = require('../src/server');
const Tenant = require('../src/models/Tenant');
const User = require('../src/models/User');
const AutomationRule = require('../src/models/AutomationRule');
const AutomationLog = require('../src/models/AutomationLog');
const { triggerAutomation } = require('../src/services/automationEngine');
const { WHATSAPP_TEMPLATE_KEYS } = require('../src/config/whatsappTemplates');
const {
  normalizeTemplateMapping,
  normalizeWhatsAppPhone,
} = require('../src/services/whatsappTemplateService');

const PORT = 5111;
const BASE = `http://127.0.0.1:${PORT}/api`;
const stamp = Date.now().toString(36);
const createdTenantIds = [];
const createdUserIds = [];
const createdRuleIds = [];

let passed = 0;
let failed = 0;

const check = (name, condition, detail = '') => {
  if (condition) {
    passed += 1;
    console.log(`[PASS] ${name}`);
  } else {
    failed += 1;
    console.log(`[FAIL] ${name}${detail ? ` — ${detail}` : ''}`);
  }
};

const request = async (method, endpoint, { token, body } = {}) => {
  const headers = {};
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

const login = async (email, password = 'ProbePass123!') => {
  const response = await request('POST', '/auth/login', { body: { email, password } });
  if (response.status !== 200 || !response.data?.token) {
    throw new Error(`Login failed for ${email}: ${response.status} ${response.data?.message || ''}`);
  }
  return response.data.token;
};

const createTenant = async (label, { whatsapp = {}, waTemplates = {} } = {}) => {
  const tenant = await Tenant.create({
    businessName: `Phase11 ${label} ${stamp}`,
    slug: `phase11-${label}-${stamp}-${Math.floor(Math.random() * 100000)}`,
    businessType: 'PRODUCT',
    templateCode: 'PRODUCT',
    status: 'ACTIVE',
    planTier: 'PRO',
    integrations: {
      whatsapp: {
        enabled: true,
        phoneNumberId:
          whatsapp.phoneNumberId !== undefined ? whatsapp.phoneNumberId : 'PHONE_NUMBER_ID',
        accessToken:
          whatsapp.accessToken !== undefined ? whatsapp.accessToken : 'wa-access-token',
        senderPhone:
          whatsapp.senderPhone !== undefined ? whatsapp.senderPhone : '919999999999',
      },
    },
    settings: {
      waTemplates,
    },
  });
  createdTenantIds.push(tenant._id);
  return tenant;
};

const createUser = async (tenant, label, role = 'MERCHANT_OWNER') => {
  const user = await User.create({
    name: `Phase11 ${role} ${label}`,
    email: `phase11-${label}-${stamp}@example.com`,
    password: 'ProbePass123!',
    role,
    businessId: tenant._id,
  });
  createdUserIds.push(user._id);
  return user;
};

const createRule = async (tenant, action, trigger = 'ORDER_CREATED') => {
  const rule = await AutomationRule.create({
    businessId: tenant._id,
    name: `Phase11 Rule ${Math.random().toString(36).slice(2, 8)}`,
    trigger,
    isActive: true,
    condition: { field: 'always', operator: 'ALWAYS', value: '' },
    action,
  });
  createdRuleIds.push(rule._id);
  return rule;
};

const ORDER_DATA = {
  customerName: 'Aarav Sharma',
  customerPhone: '9876543210',
  orderNumber: 'ORD-9001',
  totalAmount: 1499,
  trackingUrl: 'https://shop.example.com/orders/track?orderNumber=ORD-9001',
};

// --- Mock Meta Graph API ---------------------------------------------------
let mockRequests = [];
let mockStatus = 200;
let mockFailuresRemaining = 0;

const resetMock = () => {
  mockRequests = [];
  mockStatus = 200;
  mockFailuresRemaining = 0;
};

const mockGraphServer = http.createServer((req, res) => {
  let raw = '';
  req.on('data', (chunk) => {
    raw += chunk;
  });
  req.on('end', () => {
    let parsed = null;
    try {
      parsed = JSON.parse(raw);
    } catch {}
    mockRequests.push({ url: req.url, body: parsed, headers: req.headers });

    if (mockFailuresRemaining > 0) {
      mockFailuresRemaining -= 1;
      res.writeHead(mockStatus, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: { message: 'probe failure', code: mockStatus } }));
      return;
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        messaging_product: 'whatsapp',
        contacts: [{ input: '9876543210', wa_id: '919876543210' }],
        messages: [{ id: 'wamid.PROBE' }],
      })
    );
  });
});

const cleanup = async () => {
  try {
    if (createdTenantIds.length) {
      await AutomationLog.deleteMany({ businessId: { $in: createdTenantIds } });
      await AutomationRule.deleteMany({ businessId: { $in: createdTenantIds } });
      await User.deleteMany({ businessId: { $in: createdTenantIds } });
      await Tenant.deleteMany({ _id: { $in: createdTenantIds } });
    }
    if (createdUserIds.length) await User.deleteMany({ _id: { $in: createdUserIds } });
    if (createdRuleIds.length) await AutomationRule.deleteMany({ _id: { $in: createdRuleIds } });
  } catch (error) {
    console.error('[Phase11 Cleanup Warning]', error.message);
  }
};

const run = async () => {
  console.log('\n============================================================');
  console.log('--- STARTING PHASE 11 WHATSAPP TEMPLATE REGRESSION ---');
  console.log('============================================================\n');

  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/omniva_saas';
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 15000 });

  const server = app.listen(PORT, '127.0.0.1');
  await once(server, 'listening');
  await once(mockGraphServer.listen(0, '127.0.0.1'), 'listening');
  const mockPort = mockGraphServer.address().port;
  process.env.META_GRAPH_API_BASE_URL = `http://127.0.0.1:${mockPort}`;

  try {
    // ---------------------------------------------------------------------
    // 1. Phone normalisation helper
    // ---------------------------------------------------------------------
    check(
      'Indian 10-digit number is normalised to 91XXXXXXXXXX',
      normalizeWhatsAppPhone('98765 43210').phone === '919876543210'
    );
    check(
      'Numbers already carrying the country code are preserved',
      normalizeWhatsAppPhone('+91 98765 43210').phone === '919876543210' &&
        normalizeWhatsAppPhone('09876543210').phone === '919876543210'
    );
    check(
      'Invalid phone numbers are rejected instead of being mangled',
      normalizeWhatsAppPhone('987654').phone === '' &&
        normalizeWhatsAppPhone('').phone === ''
    );

    // ---------------------------------------------------------------------
    // 2. Tenant template mapping endpoint: roles, validation, isolation
    // ---------------------------------------------------------------------
    const tenant = await createTenant('mapping', {
      waTemplates: { order_confirmation: 'order_conf_v2' },
    });
    const owner = await createUser(tenant, 'owner');
    const marketing = await createUser(tenant, 'marketing', 'MARKETING_STAFF');
    const support = await createUser(tenant, 'support', 'SUPPORT_STAFF');
    const [ownerToken, marketingToken, supportToken] = await Promise.all([
      login(owner.email),
      login(marketing.email),
      login(support.email),
    ]);

    const listRes = await request('GET', '/integrations/whatsapp-templates', { token: ownerToken });
    const orderConfirmation = (listRes.data?.templates || []).find(
      (t) => t.key === 'order_confirmation'
    );
    check(
      'Template catalogue exposes the six supported templates',
      listRes.status === 200 &&
        (listRes.data?.templates || []).length === WHATSAPP_TEMPLATE_KEYS.length &&
        WHATSAPP_TEMPLATE_KEYS.every((key) =>
          (listRes.data?.templates || []).some((t) => t.key === key)
        ),
      `status=${listRes.status}`
    );
    check(
      'Mapped template is reported as configured with its approved name',
      orderConfirmation?.configured === true &&
        orderConfirmation?.templateName === 'order_conf_v2' &&
        Array.isArray(orderConfirmation?.bodyVariables) &&
        orderConfirmation.bodyVariables.join(',') ===
          'customerName,orderNumber,totalAmount,trackingUrl',
      JSON.stringify(orderConfirmation || {})
    );

    const marketingRead = await request('GET', '/integrations/whatsapp-templates', {
      token: marketingToken,
    });
    const supportRead = await request('GET', '/integrations/whatsapp-templates', {
      token: supportToken,
    });
    check(
      'Template mapping read: owner and marketing allowed, support denied',
      marketingRead.status === 200 && supportRead.status === 403,
      `marketing=${marketingRead.status}, support=${supportRead.status}`
    );

    const marketingWrite = await request('PUT', '/integrations/whatsapp-templates', {
      token: marketingToken,
      body: { mapping: { order_shipped: 'ship_v1' } },
    });
    const supportWrite = await request('PUT', '/integrations/whatsapp-templates', {
      token: supportToken,
      body: { mapping: { order_shipped: 'ship_v1' } },
    });
    check(
      'Template mapping write is owner-only',
      marketingWrite.status === 403 && supportWrite.status === 403,
      `marketing=${marketingWrite.status}, support=${supportWrite.status}`
    );

    const badKeyWrite = await request('PUT', '/integrations/whatsapp-templates', {
      token: ownerToken,
      body: { mapping: { not_a_template: 'x' } },
    });
    const badLanguageWrite = await request('PUT', '/integrations/whatsapp-templates', {
      token: ownerToken,
      body: { defaultLanguage: 'not a language' },
    });
    check(
      'Unknown template keys and invalid languages are rejected',
      badKeyWrite.status === 400 && badLanguageWrite.status === 400,
      `key=${badKeyWrite.status}, language=${badLanguageWrite.status}`
    );

    const otherTenant = await createTenant('other');
    const otherOwner = await createUser(otherTenant, 'other-owner');
    const otherToken = await login(otherOwner.email);
    await request('PUT', '/integrations/whatsapp-templates', {
      token: ownerToken,
      body: {
        mapping: {
          order_shipped: 'ship_v1',
          cod_verification: { name: 'cod_v1', language: 'hi' },
        },
        defaultLanguage: 'en',
      },
    });
    const otherTenantAfter = await Tenant.findById(otherTenant._id);
    const otherMapping = normalizeTemplateMapping(otherTenantAfter?.settings?.waTemplates);
    check(
      'Template mapping changes never leak across tenants',
      !otherMapping.order_shipped && otherTenantAfter?.settings?.waDefaultLanguage === 'en',
      JSON.stringify(otherMapping)
    );

    const idempotentWrite = await request('PUT', '/integrations/whatsapp-templates', {
      token: ownerToken,
      body: { mapping: { order_confirmation: 'order_conf_v2' } },
    });
    const idempotentAgain = await request('PUT', '/integrations/whatsapp-templates', {
      token: ownerToken,
      body: { mapping: { order_confirmation: 'order_conf_v2' } },
    });
    const tenantAfterWrites = await Tenant.findById(tenant._id);
    const finalMapping = normalizeTemplateMapping(tenantAfterWrites?.settings?.waTemplates);
    check(
      'Repeating the same mapping update is idempotent',
      idempotentWrite.status === 200 &&
        idempotentAgain.status === 200 &&
        finalMapping.order_confirmation?.name === 'order_conf_v2' &&
        Object.keys(finalMapping).length === 3,
      JSON.stringify(finalMapping)
    );

    // ---------------------------------------------------------------------
    // 3. Engine sends the mapped template with correct body order
    // ---------------------------------------------------------------------
    resetMock();
    const rule = await createRule(tenant, {
      type: 'SEND_WHATSAPP_TEMPLATE',
      target: 'customer',
      whatsappTemplateKey: 'order_confirmation',
      template: 'Order {{orderNumber}} for {{customerName}}',
    });

    const results = await triggerAutomation({
      businessId: tenant._id,
      trigger: 'ORDER_CREATED',
      entityType: 'ORDER',
      entityId: 'PHASE11-ORDER-1',
      data: ORDER_DATA,
      targetRuleId: rule._id,
    });

    const sentBody = mockRequests[0]?.body;
    const bodyParams = sentBody?.template?.components?.[0]?.parameters || [];
    check(
      'Mapped template is delivered to Meta with the approved template name',
      mockRequests.length === 1 &&
        sentBody?.type === 'template' &&
        sentBody?.template?.name === 'order_conf_v2' &&
        sentBody?.template?.language?.code === 'en' &&
        sentBody?.to === '919876543210',
      JSON.stringify(sentBody || {}).slice(0, 300)
    );
    check(
      'Body parameters follow the approved template order',
      bodyParams.length === 4 &&
        bodyParams[0]?.text === 'Aarav Sharma' &&
        bodyParams[1]?.text === 'ORD-9001' &&
        bodyParams[2]?.text === '1499' &&
        bodyParams[3]?.text === ORDER_DATA.trackingUrl,
      JSON.stringify(bodyParams)
    );
    check(
      'Successful delivery is logged with the provider message id',
      results?.[0]?.status === 'SUCCESS' &&
        Boolean(
          await AutomationLog.findOne({
            businessId: tenant._id,
            providerMessageId: 'wamid.PROBE',
            provider: 'meta_whatsapp',
          })
        ),
      JSON.stringify(results || [])
    );
    check(
      'Only approved templates are ever sent (no free-form text message)',
      mockRequests.every((entry) => entry.body?.type === 'template')
    );
    check(
      'The tenant access token is decrypted at rest and used for the Meta call',
      mockRequests[0]?.headers?.authorization === 'Bearer wa-access-token',
      String(mockRequests[0]?.headers?.authorization || 'missing')
    );

    // ---------------------------------------------------------------------
    // 4. Empty values must not shift later values into the wrong slot
    // ---------------------------------------------------------------------
    resetMock();
    await triggerAutomation({
      businessId: tenant._id,
      trigger: 'ORDER_CREATED',
      entityType: 'ORDER',
      entityId: 'PHASE11-ORDER-2',
      data: { ...ORDER_DATA, totalAmount: '' },
      targetRuleId: rule._id,
    });
    const shiftedParams = mockRequests[0]?.body?.template?.components?.[0]?.parameters || [];
    check(
      'A missing middle value keeps the parameter count and positions intact',
      shiftedParams.length === 4 &&
        shiftedParams[0]?.text === 'Aarav Sharma' &&
        shiftedParams[1]?.text === 'ORD-9001' &&
        shiftedParams[2]?.text === '' &&
        shiftedParams[3]?.text === ORDER_DATA.trackingUrl,
      JSON.stringify(shiftedParams)
    );

    // ---------------------------------------------------------------------
    // 5. Missing mapping / credentials / invalid phone are skipped, not failed
    // ---------------------------------------------------------------------
    resetMock();
    const unmappedRule = await createRule(tenant, {
      type: 'SEND_WHATSAPP_TEMPLATE',
      target: 'customer',
      whatsappTemplateKey: 'cart_recovery',
      template: 'Cart recovery',
    });
    const unmappedResult = await triggerAutomation({
      businessId: tenant._id,
      trigger: 'ORDER_CREATED',
      entityType: 'ORDER',
      entityId: 'PHASE11-ORDER-3',
      data: ORDER_DATA,
      targetRuleId: unmappedRule._id,
    });
    check(
      'Unmapped template is skipped with an actionable reason and no Meta call',
      unmappedResult?.[0]?.status === 'SKIPPED' &&
        /cart_recovery/.test(unmappedResult?.[0]?.reason || '') &&
        mockRequests.length === 0,
      JSON.stringify(unmappedResult || [])
    );

    resetMock();
    const noCredsTenant = await createTenant('nocreds', { whatsapp: { accessToken: '' } });
    const noCredsOwner = await createUser(noCredsTenant, 'nocreds');
    const noCredsToken = await login(noCredsOwner.email);
    const noCredsRule = await createRule(noCredsTenant, {
      type: 'SEND_WHATSAPP_TEMPLATE',
      target: 'customer',
      whatsappTemplateName: 'order_conf_v2',
      template: 'Order {{orderNumber}}',
    });
    const noCredsResult = await triggerAutomation({
      businessId: noCredsTenant._id,
      trigger: 'ORDER_CREATED',
      entityType: 'ORDER',
      entityId: 'PHASE11-ORDER-4',
      data: ORDER_DATA,
      targetRuleId: noCredsRule._id,
    });
    check(
      'Missing WhatsApp credentials skip the message instead of failing',
      noCredsResult?.[0]?.status === 'SKIPPED' &&
        /credentials/i.test(noCredsResult?.[0]?.reason || '') &&
        mockRequests.length === 0,
      JSON.stringify(noCredsResult || [])
    );
    void noCredsToken;

    resetMock();
    const badPhoneResult = await triggerAutomation({
      businessId: tenant._id,
      trigger: 'ORDER_CREATED',
      entityType: 'ORDER',
      entityId: 'PHASE11-ORDER-5',
      data: { ...ORDER_DATA, customerPhone: '98765' },
      targetRuleId: rule._id,
    });
    check(
      'An invalid phone number is skipped and never sent to Meta',
      badPhoneResult?.[0]?.status === 'SKIPPED' && mockRequests.length === 0,
      JSON.stringify(badPhoneResult || [])
    );

    // ---------------------------------------------------------------------
    // 6. Rule level template name overrides the tenant mapping
    // ---------------------------------------------------------------------
    resetMock();
    const overrideRule = await createRule(tenant, {
      type: 'SEND_WHATSAPP',
      target: 'customer',
      whatsappTemplateName: 'override_template_v9',
      whatsappTemplateVariables: ['customerName', 'orderNumber'],
      template: 'Override',
    });
    await triggerAutomation({
      businessId: tenant._id,
      trigger: 'ORDER_CREATED',
      entityType: 'ORDER',
      entityId: 'PHASE11-ORDER-6',
      data: ORDER_DATA,
      targetRuleId: overrideRule._id,
    });
    check(
      'An explicit rule template name wins over the tenant mapping',
      mockRequests[0]?.body?.template?.name === 'override_template_v9' &&
        (mockRequests[0]?.body?.template?.components?.[0]?.parameters || []).length === 2,
      JSON.stringify(mockRequests[0]?.body || {})
    );

    // ---------------------------------------------------------------------
    // 6b. Language inheritance: rule -> mapping -> tenant default -> en
    // ---------------------------------------------------------------------
    resetMock();
    const inheritedLanguageRule = await createRule(tenant, {
      type: 'SEND_WHATSAPP_TEMPLATE',
      target: 'customer',
      whatsappTemplateKey: 'cod_verification',
      template: 'Confirm order {{orderNumber}}',
    });
    await triggerAutomation({
      businessId: tenant._id,
      trigger: 'ORDER_CREATED',
      entityType: 'ORDER',
      entityId: 'PHASE11-ORDER-6B',
      data: ORDER_DATA,
      targetRuleId: inheritedLanguageRule._id,
    });
    const inheritedLanguage = mockRequests[0]?.body?.template?.language?.code;

    resetMock();
    const explicitLanguageRule = await createRule(tenant, {
      type: 'SEND_WHATSAPP_TEMPLATE',
      target: 'customer',
      whatsappTemplateKey: 'cod_verification',
      whatsappTemplateLanguage: 'en',
      template: 'Confirm order {{orderNumber}}',
    });
    await triggerAutomation({
      businessId: tenant._id,
      trigger: 'ORDER_CREATED',
      entityType: 'ORDER',
      entityId: 'PHASE11-ORDER-6C',
      data: ORDER_DATA,
      targetRuleId: explicitLanguageRule._id,
    });
    const explicitLanguage = mockRequests[0]?.body?.template?.language?.code;

    check(
      'Template language is inherited from the mapping unless the rule overrides it',
      inheritedLanguage === 'hi' &&
        explicitLanguage === 'en' &&
        mockRequests[0]?.body?.template?.name === 'cod_v1',
      `inherited=${inheritedLanguage}, explicit=${explicitLanguage}`
    );

    // ---------------------------------------------------------------------
    // 7. Tenant isolation on trigger
    // ---------------------------------------------------------------------
    resetMock();
    const crossTenantResult = await triggerAutomation({
      businessId: otherTenant._id,
      trigger: 'ORDER_CREATED',
      entityType: 'ORDER',
      entityId: 'PHASE11-ORDER-7',
      data: ORDER_DATA,
      targetRuleId: rule._id,
    });
    check(
      "Another tenant cannot trigger this tenant's rule",
      (crossTenantResult || []).length === 0 && mockRequests.length === 0,
      JSON.stringify(crossTenantResult || [])
    );

    // ---------------------------------------------------------------------
    // 8. Retry policy: 5xx is retried, 4xx is not
    // ---------------------------------------------------------------------
    resetMock();
    mockStatus = 500;
    mockFailuresRemaining = 5;
    const retryResult = await triggerAutomation({
      businessId: tenant._id,
      trigger: 'ORDER_CREATED',
      entityType: 'ORDER',
      entityId: 'PHASE11-ORDER-8',
      data: ORDER_DATA,
      targetRuleId: rule._id,
    });
    check(
      'A failing Meta API is retried three times and then logged as FAILED',
      retryResult?.[0]?.status === 'FAILED' && mockRequests.length === 3,
      `attempts=${mockRequests.length}, status=${retryResult?.[0]?.status}`
    );

    resetMock();
    mockStatus = 400;
    mockFailuresRemaining = 5;
    const noRetryResult = await triggerAutomation({
      businessId: tenant._id,
      trigger: 'ORDER_CREATED',
      entityType: 'ORDER',
      entityId: 'PHASE11-ORDER-9',
      data: ORDER_DATA,
      targetRuleId: rule._id,
    });
    check(
      'A rejected template (4xx) is not retried',
      noRetryResult?.[0]?.status === 'FAILED' && mockRequests.length === 1,
      `attempts=${mockRequests.length}, status=${noRetryResult?.[0]?.status}`
    );
    resetMock();
  } catch (error) {
    failed += 1;
    console.error('[Phase11 Fatal Error]', error);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await new Promise((resolve) => mockGraphServer.close(resolve));
    await cleanup();
    await mongoose.disconnect();
  }

  console.log('\n============================================================');
  console.log(`--- PHASE 11 RESULT: ${passed} passed, ${failed} failed ---`);
  console.log('============================================================\n');
  if (failed > 0) process.exitCode = 1;
};

run().catch((error) => {
  console.error('[Phase11 Runner Error]', error);
  process.exitCode = 1;
});
