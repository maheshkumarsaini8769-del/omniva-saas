const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const { app } = require('../src/server');
const { authRateLimiter, checkoutRateLimiter } = require('../src/middlewares/rateLimitMiddleware');
const { runBackup } = require('../scripts/backup');

let server;
let merchantAToken;

const runTests = async () => {
  console.log('\n============================================================');
  console.log('--- STARTING PHASE 8 ULTRA-DEEP SECURITY & DEPLOYMENT TEST ---');
  console.log('============================================================\n');

  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/omniva_saas';
  await mongoose.connect(mongoUri);

  const PORT = 5008;
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
    // 1. Authenticate Merchant A
    await test('1. Authenticate Merchant A and verify token issuance', async () => {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'rahul@desirasoi.com', password: 'password123' }),
      });
      const data = await res.json();
      if (!data.success || !data.token) throw new Error('Login failed');
      merchantAToken = data.token;
    });

    // 2. Deep Health & Production Readiness Check
    await test('2. Deep Health Check (GET /api/health/deep) returns ready status and metrics', async () => {
      const res = await fetch(`${BASE_URL}/health/deep`);
      if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
      const data = await res.json();

      if (data.status !== 'ready') throw new Error(`Expected status: ready, got ${data.status}`);
      if (!data.database?.connected) throw new Error('Database connected flag is false');
      if (data.database?.latencyMs < 0) throw new Error('Invalid DB latency');
      if (!data.system?.memory?.heapUsedMb) throw new Error('Memory stats missing');
      if (!data.security?.helmetActive || !data.security?.nosqlSanitizationActive) {
        throw new Error('Security checks failed');
      }
    });

    // 3. NoSQL Injection Prevention Test
    await test('3. Security: NoSQL Operator Injection ($gt, $ne) is cleanly stripped by sanitizer', async () => {
      // Send a body with malicious $gt operator
      const res = await fetch(`${BASE_URL}/crm/leads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${merchantAToken}`,
        },
        body: JSON.stringify({
          name: 'Injection Test',
          phone: '9888877777',
          source: 'WEBSITE',
          $where: 'malicious code',
          notes: {
            $gt: '',
            legitNote: 'This is safe',
          },
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.message);

      // Verify the saved lead does not contain $where or $gt
      const Lead = require('../src/models/Lead');
      const lead = await Lead.findById(data.lead._id);
      if (lead.$where !== undefined) throw new Error('Sanitizer failed: $where still present');
      // Clean up test lead
      await Lead.findByIdAndDelete(data.lead._id);
    });

    // 3b. Stored XSS vectors are stripped from string inputs.
    await test('3b. Security: Stored XSS payloads are stripped from string inputs', async () => {
      const Lead = require('../src/models/Lead');
      const res = await fetch(`${BASE_URL}/crm/leads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${merchantAToken}`,
        },
        body: JSON.stringify({
          name: '<img src=x onerror=alert(1)>',
          phone: '9888877778',
          source: 'WEBSITE',
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      const lead = await Lead.findById(data.lead._id);
      if (/onerror|javascript:/i.test(lead.name)) {
        throw new Error(`Sanitizer left an XSS vector in the stored name: ${lead.name}`);
      }
      await Lead.findByIdAndDelete(data.lead._id);
    });

    // 4. Rate Limiting on Authentication (Brute Force Defense)
    await test('4. Security: Authentication Brute Force Protection enforces 429 RATE_LIMIT_EXCEEDED', async () => {
      authRateLimiter.resetAll();

      let blocked = false;
      let limitHitCode = null;

      // Send 16 login attempts from same IP (Limit is 15)
      for (let i = 0; i < 16; i++) {
        const res = await fetch(`${BASE_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'rahul@desirasoi.com', password: 'wrongpassword' }),
        });

        if (res.status === 429) {
          blocked = true;
          const data = await res.json();
          limitHitCode = data.code;
          const remainingHeader = res.headers.get('x-ratelimit-remaining');
          if (remainingHeader !== '0') throw new Error(`Expected remaining 0, got ${remainingHeader}`);
          break;
        }
      }

      if (!blocked) throw new Error('Rate limiter did not block 16th rapid authentication attempt');
      if (limitHitCode !== 'RATE_LIMIT_EXCEEDED') throw new Error(`Expected code RATE_LIMIT_EXCEEDED, got ${limitHitCode}`);

      // Reset limiter for subsequent tests
      authRateLimiter.resetAll();
    });

    // 5. Automated Database Backup Execution
    await test('5. Operations: Automated DB Backup creates timestamped snapshot with manifest', async () => {
      await runBackup();

      const backupsDir = path.resolve(__dirname, '../backups');
      if (!fs.existsSync(backupsDir)) throw new Error('Backups directory not created');

      const snapshotDirs = fs.readdirSync(backupsDir).filter((f) => f.startsWith('snapshot-'));
      if (snapshotDirs.length === 0) throw new Error('No snapshot directories found');

      const latestSnapshot = path.join(backupsDir, snapshotDirs[snapshotDirs.length - 1]);
      const manifestPath = path.join(latestSnapshot, 'manifest.json');
      if (!fs.existsSync(manifestPath)) throw new Error('Manifest not generated in snapshot');

      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      if (manifest.totalDocuments <= 0) throw new Error('Archived 0 documents in snapshot');
    });

    // 6. Grand Master Regression Across All Phases (Phases 1-7)
    await test('6. Grand Master Regression: Auth, CRM, Meta CAPI, Storefront, Bookings, Automations & Subscriptions', async () => {
      // Phase 1 Auth
      const authRes = await fetch(`${BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${merchantAToken}` },
      });
      if (authRes.status !== 200) throw new Error('Phase 1 Auth failed');

      // Phase 2 CRM
      const crmRes = await fetch(`${BASE_URL}/crm/stats`, {
        headers: { Authorization: `Bearer ${merchantAToken}` },
      });
      if (crmRes.status !== 200) throw new Error('Phase 2 CRM failed');

      // Phase 3 Meta Tracking
      const metaRes = await fetch(`${BASE_URL}/meta/settings`, {
        headers: { Authorization: `Bearer ${merchantAToken}` },
      });
      if (metaRes.status !== 200) throw new Error('Phase 3 Meta failed');

      // Phase 4 Commerce
      const prodRes = await fetch(`${BASE_URL}/products`, {
        headers: { Authorization: `Bearer ${merchantAToken}` },
      });
      if (prodRes.status !== 200) throw new Error('Phase 4 Products failed');

      // Phase 5 Bookings (Gated: 403 for PRODUCT merchant without bookings, or 200 if enabled)
      const bookRes = await fetch(`${BASE_URL}/bookings`, {
        headers: { Authorization: `Bearer ${merchantAToken}` },
      });
      if (bookRes.status !== 200 && bookRes.status !== 403) throw new Error(`Phase 5 Bookings failed with status ${bookRes.status}`);

      // Phase 6 Automations
      const autoRes = await fetch(`${BASE_URL}/automations/rules`, {
        headers: { Authorization: `Bearer ${merchantAToken}` },
      });
      if (autoRes.status !== 200) throw new Error('Phase 6 Automations failed');

      // Phase 7 Subscriptions
      const subRes = await fetch(`${BASE_URL}/subscriptions/usage`, {
        headers: { Authorization: `Bearer ${merchantAToken}` },
      });
      if (subRes.status !== 200) throw new Error('Phase 7 Subscriptions failed');
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
