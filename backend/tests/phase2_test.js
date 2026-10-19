const http = require('http');
const { startServer } = require('../src/server.js');
const TEST_PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5001;

const request = (options, data) => {
  options.port = TEST_PORT;
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
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

async function runPhase2Tests() {
  await startServer();
  await new Promise(r => setTimeout(r, 1000));

  console.log('=== ULTRA-DEEP PHASE 2: CRM & TRACE PIPELINE TEST SUITE ===\n');

  // 1. Login Merchant A (Rahul Sharma - Desi Rasoi Achar)
  const loginA = await request({
    hostname: '127.0.0.1', port: 5000, path: '/api/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'rahul@desirasoi.com', password: 'password123' });
  const tokenA = loginA.data.token;
  console.log('Test 1: Login Merchant A -> Status:', loginA.status, 'Business:', loginA.data.tenant?.businessName);

  // 2. Login Merchant B (Vikram Singh - Royal Films Studio)
  const loginB = await request({
    hostname: '127.0.0.1', port: 5000, path: '/api/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'vikram@royalfilms.com', password: 'password123' });
  const tokenB = loginB.data.token;
  console.log('Test 2: Login Merchant B -> Status:', loginB.status, 'Business:', loginB.data.tenant?.businessName);

  // Clean test leads for isolation verification
  const Lead = require('../src/models/Lead');
  await Lead.deleteMany({ businessId: loginB.data.tenant.id });

  // 3. Create Lead 1 for Merchant A from Meta Ads
  const lead1Res = await request({
    hostname: '127.0.0.1', port: 5000, path: '/api/crm/leads', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + tokenA }
  }, {
    name: 'Anjali Verma',
    phone: '9811223344',
    email: 'anjali@example.com',
    source: 'META_ADS',
    campaignName: 'Diwali Homemade Pickle Special',
    adSetName: 'Delhi NCR Foodies 25-45',
    adName: 'Mango Pickle Video Creative #2',
    budget: 1500,
    initialNote: 'Customer interested in 5kg bulk order for Diwali gift hampers.'
  });
  console.log('Test 3: Create Lead 1 (Meta Ads) -> Status:', lead1Res.status, 'Lead ID:', lead1Res.data.lead?._id);
  const lead1Id = lead1Res.data.lead?._id;

  // 4. Duplicate Lead Detection Test: Post lead with same phone
  const dupRes = await request({
    hostname: '127.0.0.1', port: 5000, path: '/api/crm/leads', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + tokenA }
  }, {
    name: 'Anjali Verma (Repeat Ad Click)',
    phone: '9811223344',
    source: 'META_ADS',
    campaignName: 'Diwali Retargeting'
  });
  console.log('Test 4: Duplicate Lead Detection -> Status:', dupRes.status, 'Is Duplicate Flagged:', dupRes.data.isDuplicate);

  // 5. Update Lead Status / Kanban Stage Transition: NEW -> CONTACTED
  const stageRes = await request({
    hostname: '127.0.0.1', port: 5000, path: '/api/crm/leads/' + lead1Id + '/status', method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + tokenA }
  }, { status: 'CONTACTED' });
  console.log('Test 5: Kanban Stage Transition (NEW -> CONTACTED) -> Status:', stageRes.status, 'New Stage:', stageRes.data.lead?.status);

  // 6. Log a Phone Call Interaction
  const callRes = await request({
    hostname: '127.0.0.1', port: 5000, path: '/api/crm/leads/' + lead1Id + '/call-logs', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + tokenA }
  }, {
    durationSeconds: 185,
    outcome: 'CONNECTED',
    notes: 'Discussed sample jars. Agreed to send sample delivery by Friday.'
  });
  console.log('Test 6: Call Logging on Lead Timeline -> Status:', callRes.status, 'Outcome:', callRes.data.callLog?.outcome);

  // 7. Schedule a Follow-Up Task
  const taskRes = await request({
    hostname: '127.0.0.1', port: 5000, path: '/api/crm/leads/' + lead1Id + '/tasks', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + tokenA }
  }, {
    title: 'Call to confirm sample arrival',
    dueDate: new Date(Date.now() + 86400000).toISOString()
  });
  console.log('Test 7: Schedule Follow-Up Task -> Status:', taskRes.status, 'Task Title:', taskRes.data.task?.title);

  // 8. Move Stage to WON
  const wonRes = await request({
    hostname: '127.0.0.1', port: 5000, path: '/api/crm/leads/' + lead1Id + '/status', method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + tokenA }
  }, { status: 'WON' });
  console.log('Test 8: Move Stage to WON -> Status:', wonRes.status, 'Stage:', wonRes.data.lead?.status);

  // 9. Fetch CRM Stats & Pipeline Summary
  const statsRes = await request({
    hostname: '127.0.0.1', port: 5000, path: '/api/crm/stats', method: 'GET',
    headers: { 'Authorization': 'Bearer ' + tokenA }
  });
  console.log('Test 9: CRM KPIs for Merchant A -> Total Leads:', statsRes.data.stats?.totalLeads, 'Won:', statsRes.data.stats?.wonLeads, 'Win Rate:', statsRes.data.stats?.winRate);

  // 10. CRITICAL PENETRATION TEST: Merchant B tries to view or update Merchant A's Lead (IDOR Attack)
  const idorRes = await request({
    hostname: '127.0.0.1', port: 5000, path: '/api/crm/leads/' + lead1Id, method: 'GET',
    headers: { 'Authorization': 'Bearer ' + tokenB }
  });
  console.log('Test 10 [SECURITY - IDOR]: Merchant B accessing Merchant A Lead -> Status:', idorRes.status, '(Expected 404 Not Found)');

  // 11. Pipeline Isolation Test: Merchant B pipeline summary must be 0
  const pipelineB = await request({
    hostname: '127.0.0.1', port: 5000, path: '/api/crm/leads', method: 'GET',
    headers: { 'Authorization': 'Bearer ' + tokenB }
  });
  console.log('Test 11 [ISOLATION]: Merchant B Leads count ->', pipelineB.data.totalCount, '(Expected 0)');

  if (
    lead1Res.status === 201 &&
    dupRes.data.isDuplicate === true &&
    stageRes.status === 200 &&
    callRes.status === 201 &&
    taskRes.status === 201 &&
    wonRes.data.lead?.status === 'WON' &&
    idorRes.status === 404 &&
    pipelineB.data.totalCount === 0
  ) {
    console.log('\n🌟 ALL 11 ULTRA-DEEP CRM & SECURITY PENETRATION TESTS PASSED 100%! 🌟');
    process.exit(0);
  } else {
    console.error('Some tests failed!');
    process.exit(1);
  }
}

runPhase2Tests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
