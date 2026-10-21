const http = require('http');
const MOCK_GRAPH_PORT = 5096;
process.env.META_GRAPH_BASE_URL = `http://127.0.0.1:${MOCK_GRAPH_PORT}`;
const { startServer } = require('../src/server.js');
const Tenant = require('../src/models/Tenant');
const MetaIntegration = require('../src/models/MetaIntegration');
const { encryptToken } = require('../src/utils/cryptoUtils');
const TEST_PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5001;

const request = (options, data) => {
  options.port = TEST_PORT;
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
};

async function runPhase3Tests() {
  await startServer();
  await new Promise((r) => setTimeout(r, 1000));

  console.log('=== ULTRA-DEEP PHASE 3: META LEAD ADS & CAPI TEST SUITE ===\n');

  // 1. Meta Webhook Verification Handshake (GET)
  const verifyRes = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/webhooks/meta?hub.mode=subscribe&hub.verify_token=omniva_meta_verify_token_2026&hub.challenge=challenge_token_8877',
    method: 'GET',
  });
  console.log(
    'Test 1: Meta Webhook Subscription Handshake -> Status:',
    verifyRes.status,
    'Challenge Returned:',
    verifyRes.raw === 'challenge_token_8877' ? '✅ MATCHED' : '❌ MISMATCH'
  );

  // 2. Meta Webhook Rejection with Invalid Token
  const badTokenRes = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/webhooks/meta?hub.mode=subscribe&hub.verify_token=wrong_token&hub.challenge=123',
    method: 'GET',
  });
  console.log(
    'Test 2: Meta Webhook Invalid Token Rejection -> Status:',
    badTokenRes.status,
    '(Expected 403 Forbidden)'
  );

  // 3. Login Merchant A (Achar) & Merchant B (Films)
  const loginA = await request(
    {
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { email: 'rahul@desirasoi.com', password: 'password123' }
  );
  const tokenA = loginA.data.token;
  const slugA = loginA.data.tenant?.slug;

  const loginB = await request(
    {
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { email: 'vikram@royalfilms.com', password: 'password123' }
  );
  const tokenB = loginB.data.token;

  // 4. Configure a local Graph API stub and a real page integration for the
  // webhook. This exercises the real ingestion path without fabricating lead
  // data inside the application.
  const testLeadId = 'META_' + Date.now();
  const testLeadName = 'Pooja Meta ' + Date.now().toString().slice(-4);
  const testLeadPhone = '98' + Math.floor(10000000 + Math.random() * 90000000);
  const pageId = 'phase3_page_' + Date.now();
  global.__phase3LeadPayload = {
    id: testLeadId,
    created_time: new Date().toISOString(),
    campaign_name: 'Instagram Reel Ad - Organic Achar Launch',
    ad_name: 'Video Reel Creative 15s',
    form_id: '99887766',
    form_name: 'Achar Launch Lead Form',
    platform: 'ig',
    field_data: [
      { name: 'full_name', values: [testLeadName] },
      { name: 'phone_number', values: [testLeadPhone] },
      { name: 'email', values: ['pooja.agarwal@example.com'] },
    ],
  };
  const mockGraphServer = http.createServer((req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(global.__phase3LeadPayload));
  });
  await new Promise((resolve) => mockGraphServer.listen(MOCK_GRAPH_PORT, '127.0.0.1', resolve));

  const tenantA = await Tenant.findOne({ slug: slugA, status: 'ACTIVE' });
  if (!tenantA) throw new Error('Merchant A tenant not found');
  let integration = await MetaIntegration.findOne({ businessId: tenantA._id });
  const createdIntegration = !integration;
  if (!integration) {
    integration = new MetaIntegration({ businessId: tenantA._id, status: 'CONNECTED', pages: [] });
  }
  integration.status = 'CONNECTED';
  integration.pages.push({
    pageId,
    pageName: 'Phase 3 Test Page',
    encryptedPageAccessToken: encryptToken('phase3-mock-page-token'),
    isSubscribed: true,
    isSelected: true,
  });
  await integration.save();

  const webhookPostRes = await request(
    {
      hostname: '127.0.0.1',
      port: 5000,
      path: `/api/webhooks/meta?tenantSlug=${slugA}`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    {
      entry: [
        {
          id: pageId,
          changes: [
            {
              field: 'leadgen',
              value: {
                leadgen_id: testLeadId,
                form_id: '99887766',
                ad_id: '11223344',
                full_name: testLeadName,
                phone_number: testLeadPhone,
                email: 'pooja.agarwal@example.com',
                campaign_name: 'Instagram Reel Ad - Organic Achar Launch',
                ad_name: 'Video Reel Creative 15s',
                budget: 3200,
              },
            },
          ],
        },
      ],
    }
  );
  console.log(
    'Test 3: Ingest Meta Lead Ad Webhook -> Status:',
    webhookPostRes.status,
    webhookPostRes.data.message
  );

  // Webhook processing is synchronous now; no background wait is required.

  // 5. Verify Ingested Lead in Merchant A's CRM
  const leadsA = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: `/api/crm/leads?search=${encodeURIComponent(testLeadName)}`,
    method: 'GET',
    headers: { Authorization: 'Bearer ' + tokenA },
  });
  const ingestedLead = leadsA.data.leads?.[0];
  console.log(
    'Test 4: Ingested Lead Present in CRM -> Name:',
    ingestedLead?.name,
    'Source:',
    ingestedLead?.source,
    'Campaign:',
    ingestedLead?.campaignName
  );

  // 5b. Email-only Meta lead must be accepted without inventing a phone number.
  const emailOnlyLeadId = 'META_EMAIL_' + Date.now();
  const emailOnlyLeadName = 'Email Only Meta ' + Date.now().toString().slice(-4);
  const emailOnlyAddress = `email-only-${Date.now()}@example.com`;
  global.__phase3LeadPayload = {
    id: emailOnlyLeadId,
    created_time: new Date().toISOString(),
    campaign_name: 'Email-only Lead Form',
    ad_name: 'Email Capture Creative',
    form_id: '99887767',
    form_name: 'Email Only Form',
    platform: 'fb',
    field_data: [
      { name: 'full_name', values: [emailOnlyLeadName] },
      { name: 'email', values: [emailOnlyAddress] },
    ],
  };
  const emailOnlyWebhookRes = await request(
    {
      hostname: '127.0.0.1',
      port: 5000,
      path: `/api/webhooks/meta?tenantSlug=${slugA}`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    {
      entry: [
        {
          id: pageId,
          changes: [
            {
              field: 'leadgen',
              value: { leadgen_id: emailOnlyLeadId, form_id: '99887767' },
            },
          ],
        },
      ],
    }
  );
  if (emailOnlyWebhookRes.status !== 200) {
    throw new Error(`Email-only Meta webhook failed with ${emailOnlyWebhookRes.status}`);
  }
  const emailOnlySearch = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: `/api/crm/leads?search=${encodeURIComponent(emailOnlyLeadName)}`,
    method: 'GET',
    headers: { Authorization: 'Bearer ' + tokenA },
  });
  const emailOnlyLead = emailOnlySearch.data.leads?.[0];
  if (!emailOnlyLead || emailOnlyLead.email !== emailOnlyAddress) {
    throw new Error('Email-only Meta lead was not persisted with its email address');
  }
  if (emailOnlyLead.phone) {
    throw new Error('Email-only Meta lead should not invent a phone number');
  }
  console.log('Test 5b: Email-only Meta lead persisted -> Phone: (empty), Email:', emailOnlyLead.email);

  // 6. Cross-Tenant Check: Merchant B must NOT see this Meta lead
  const leadsB = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: `/api/crm/leads?search=${encodeURIComponent(testLeadName)}`,
    method: 'GET',
    headers: { Authorization: 'Bearer ' + tokenB },
  });
  console.log(
    'Test 5 [ISOLATION]: Merchant B search for Meta Lead -> Count:',
    leadsB.data.totalCount,
    '(Expected 0)'
  );

  // 7. Update Meta Tracking Settings (Pixel ID + CAPI Token)
  const updateSettingsRes = await request(
    {
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/meta/settings',
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + tokenA,
      },
    },
    {
      metaPixelId: '987654321098765',
      metaCapiToken: 'mock_eaab_token_1234567890',
    }
  );
  console.log(
    'Test 6: Update Meta Tracking Settings -> Status:',
    updateSettingsRes.status,
    'Pixel ID Saved:',
    updateSettingsRes.data.settings?.metaPixelId
  );

  // 8. Test Server-Side Conversions API (CAPI) Dispatch
  const capiTestRes = await request(
    {
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/meta/test-capi',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + tokenA,
      },
    },
    {
      eventName: 'Lead',
      testEmail: 'pooja.agarwal@example.com',
      testPhone: '9844556677',
      value: 3200,
    }
  );
  console.log(
    'Test 7: CAPI Server-Side Event Dispatch -> Status:',
    capiTestRes.status,
    'Mode:',
    capiTestRes.data.result?.mode,
    'Event ID:',
    capiTestRes.data.result?.eventId
  );

  // 9. Regression Check: Phase 1 & 2
  const regMe = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/auth/me',
    method: 'GET',
    headers: { Authorization: 'Bearer ' + tokenA },
  });
  const regCRM = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/crm/stats',
    method: 'GET',
    headers: { Authorization: 'Bearer ' + tokenA },
  });
  console.log(
    'Test 8 [REGRESSION]: Phase 1 Profile Check ->',
    regMe.status === 200 ? '✅ PASS' : '❌ FAIL'
  );
  console.log(
    'Test 9 [REGRESSION]: Phase 2 CRM Stats Check ->',
    regCRM.status === 200 ? '✅ PASS' : '❌ FAIL'
  );

  // Verify fail-closed behavior: an unmapped page must not silently succeed.
  const unmappedRes = await request(
    {
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/webhooks/meta',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    {
      entry: [
        {
          id: 'unmapped_page_' + Date.now(),
          changes: [{ field: 'leadgen', value: { leadgen_id: 'unmapped_' + Date.now() } }],
        },
      ],
    }
  );
  console.log(
    'Test 10 [FAIL-CLOSED]: Unmapped Meta page rejected -> Status:',
    unmappedRes.status,
    '(Expected 500 so Meta retries)'
  );

  // Remove the test page/integration we created.
  await MetaIntegration.updateOne(
    { businessId: tenantA._id },
    { $pull: { pages: { pageId } } }
  );
  if (createdIntegration) {
    await MetaIntegration.deleteOne({ businessId: tenantA._id });
  }

  const testsPassed =
    verifyRes.raw === 'challenge_token_8877' &&
    badTokenRes.status === 403 &&
    webhookPostRes.status === 200 &&
    ingestedLead?.source === 'META_ADS' &&
    leadsB.data.totalCount === 0 &&
    updateSettingsRes.status === 200 &&
    capiTestRes.data.success === false &&
    capiTestRes.data.result?.mode === 'NOT_CONFIGURED' &&
    unmappedRes.status === 500 &&
    regMe.status === 200 &&
    regCRM.status === 200;

  mockGraphServer.close();
  if (testsPassed) {
    console.log('\n🌟 ALL 10 ULTRA-DEEP META ADS & CAPI TESTS PASSED 100%! 🌟');
    process.exit(0);
  } else {
    console.error('Phase 3 tests failed!');
    process.exit(1);
  }
}

runPhase3Tests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
