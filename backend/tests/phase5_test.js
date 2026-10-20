const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const { app } = require('../src/server');
const Tenant = require('../src/models/Tenant');
const User = require('../src/models/User');
const ServicePackage = require('../src/models/ServicePackage');
const Booking = require('../src/models/Booking');
const Lead = require('../src/models/Lead');
const Order = require('../src/models/Order');

let server;
let merchantAToken;
let merchantBToken;
let merchantATenantId;
let merchantBTenantId;
let merchantASlug;
let merchantBSlug;
let package1Id;
let package2Id;
let createdBookingNumber;
let createdBookingId;

const runTests = async () => {
  console.log('\n============================================================');
  console.log('--- STARTING PHASE 5 ULTRA-DEEP BOOKINGS & SERVICE TEST ---');
  console.log('============================================================\n');

  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/omniva_saas';
  await mongoose.connect(mongoUri);

  const PORT = 5005;
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
    await test('1. Authenticate Merchant B (Studio) & Merchant A (Product)', async () => {
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
    });

    // Clean previous booking data for test isolation
    await ServicePackage.deleteMany({ businessId: { $in: [merchantATenantId, merchantBTenantId] } });
    await Booking.deleteMany({ businessId: { $in: [merchantATenantId, merchantBTenantId] } });
    await Lead.deleteMany({ businessId: merchantBTenantId, phone: { $in: ['9811223344', '9822334455'] } });

    // 2. Service Packages Creation & Tenant Isolation
    await test('2. Create Service Packages for Studio and verify Tenant Isolation', async () => {
      // Package 1: Pre-Wedding Film
      const res1 = await fetch(`${BASE_URL}/packages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${merchantBToken}`,
        },
        body: JSON.stringify({
          name: 'Pre-Wedding Cinematic Film',
          category: 'Wedding',
          duration: 'Full Day',
          price: 25000,
          advanceTokenPercent: 20, // 5000 advance
          deliverables: ['2 Cine Cameras', '1 Drone Pilot', '1 Min Teaser', 'Full 4K Video'],
          description: 'Breathtaking couple shoot at scenic locations',
        }),
      });
      const data1 = await res1.json();
      if (!data1.success || !data1.data._id) throw new Error(`Package 1 create failed: ${data1.message}`);
      package1Id = data1.data._id;

      // Package 2: Baby Portfolio
      const res2 = await fetch(`${BASE_URL}/packages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${merchantBToken}`,
        },
        body: JSON.stringify({
          name: 'Baby Portfolio Shoot',
          category: 'Studio',
          duration: '2 Hours',
          price: 8500,
          advanceTokenPercent: 25,
          deliverables: ['1 Photographer', '3 Themes', '15 High-End Retouched Edits'],
          description: 'Fun & safe studio setup for infants and toddlers',
        }),
      });
      const data2 = await res2.json();
      if (!data2.success || !data2.data._id) throw new Error(`Package 2 create failed: ${data2.message}`);
      package2Id = data2.data._id;

      // Check Merchant B has 2 packages
      const resListB = await fetch(`${BASE_URL}/packages`, {
        headers: { Authorization: `Bearer ${merchantBToken}` },
      });
      const dataListB = await resListB.json();
      if (dataListB.count !== 2) throw new Error(`Expected 2 packages for Merchant B, found ${dataListB.count}`);

      // Check Merchant A has 0 packages or is module-gated (403)
      const resListA = await fetch(`${BASE_URL}/packages`, {
        headers: { Authorization: `Bearer ${merchantAToken}` },
      });
      if (resListA.status === 403) {
        // Expected: serviceBookings/travelBookings module disabled for PRODUCT merchant
      } else {
        const dataListA = await resListA.json();
        if (dataListA.count !== 0) throw new Error(`Tenant leak! Merchant A sees ${dataListA.count} packages`);
      }
    });

    // 3. Public Storefront Discovery for Service Merchant
    await test('3. Public Storefront Discovery of Service Packages', async () => {
      const res = await fetch(`${BASE_URL}/public/store/${merchantBSlug}`);
      const data = await res.json();
      if (!data.success) throw new Error(`Public storefront fetch failed: ${data.message}`);
      if (!data.data.packages || data.data.packages.length !== 2) {
        throw new Error(`Expected 2 packages in public storefront, got ${data.data.packages?.length}`);
      }
      if (data.data.packages[0].name !== 'Baby Portfolio Shoot') {
        throw new Error(`Sorted packages mismatch: ${data.data.packages[0].name}`);
      }
    });

    // 4. Public Booking Request Submission (Photography Shoot)
    await test('4. Public Shoot Booking Submission records no payment until verified', async () => {
      const bookingPayload = {
        packageId: package1Id,
        customerName: 'Rohan Malhotra',
        customerPhone: '9811223344',
        customerEmail: 'rohan.malhotra@gmail.com',
        eventDate: '2026-11-20',
        timeSlot: 'Sunset / Evening (04:00 PM - 08:00 PM)',
        location: 'Neemrana Fort Palace, Rajasthan',
        notes: 'Need royal theme attire consultation',
        attribution: {
          utmSource: 'meta_ads',
          utmCampaign: 'cinematic_prewedding_reel',
          fbclid: 'fb_shoot_998877',
        },
      };

      const res = await fetch(`${BASE_URL}/public/store/${merchantBSlug}/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingPayload),
      });

      const data = await res.json();
      if (!data.success || !data.data.bookingNumber) {
        throw new Error(`Public booking failed: ${data.message}`);
      }

      createdBookingNumber = data.data.bookingNumber;
      createdBookingId = data.data.bookingId;

      if (data.data.totalAmount !== 25000) {
        throw new Error(`Expected total ₹25000, got ${data.data.totalAmount}`);
      }
      if (data.data.advancePaid !== 0) {
        throw new Error(`Expected ₹0 collected before payment, got ${data.data.advancePaid}`);
      }
      if (data.data.expectedAdvance !== 5000) {
        throw new Error(`Expected ₹5000 (20%) token due, got ${data.data.expectedAdvance}`);
      }
      if (data.data.balanceDue !== 25000) {
        throw new Error(`Expected full balance ₹25000 before payment, got ${data.data.balanceDue}`);
      }
      if (data.data.paymentStatus !== 'UNPAID') {
        throw new Error(`Expected UNPAID status, got ${data.data.paymentStatus}`);
      }
      if (data.data.bookingStatus !== 'PENDING') {
        throw new Error(`Expected PENDING status, got ${data.data.bookingStatus}`);
      }
    });

    // 5. Public Booking Request (Travel Tour with Passenger Roster)
    await test('5. Public Booking with Passenger Manifest', async () => {
      const travelPayload = {
        packageId: package2Id,
        customerName: 'Pooja Verma',
        customerPhone: '9822334455',
        eventDate: '2026-12-05',
        timeSlot: 'Morning (08:00 AM - 12:00 PM)',
        passengers: [
          { name: 'Pooja Verma', age: 28, gender: 'Female', seatNo: 'A1', pickupPoint: 'Delhi Gate' },
          { name: 'Anand Verma', age: 31, gender: 'Male', seatNo: 'A2', pickupPoint: 'Delhi Gate' },
        ],
      };

      const res = await fetch(`${BASE_URL}/public/store/${merchantBSlug}/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(travelPayload),
      });

      const data = await res.json();
      if (!data.success || !data.data.bookingNumber) {
        throw new Error(`Passenger booking failed: ${data.message}`);
      }

      const savedBooking = await Booking.findById(data.data.bookingId);
      if (savedBooking.passengers.length !== 2) {
        throw new Error(`Expected 2 passengers saved, found ${savedBooking.passengers.length}`);
      }
    });

    // 6. Verify Automatic CRM Lead Creation from Booking Enquiries
    await test('6. Automatic CRM Lead Pipeline Sync for Booking Request', async () => {
      const lead = await Lead.findOne({ businessId: merchantBTenantId, phone: '9811223344' });
      if (!lead) throw new Error('Lead not synced to CRM for booking client');
      if (lead.status !== 'NEW') throw new Error(`Expected a booking inquiry to stay in NEW until reviewed, got ${lead.status}`);
      if (lead.budget !== 25000) throw new Error(`Expected budget ₹25000, got ${lead.budget}`);
      if (lead.campaignName !== 'cinematic_prewedding_reel') {
        throw new Error(`Attribution lost: expected cinematic_prewedding_reel, got ${lead.campaignName}`);
      }
    });

    // 7. Merchant Booking Administration & Staff Assignment
    await test('7. Merchant Booking Status Progression, Crew Assignment & Payment Update', async () => {
      // 1. Fetch bookings list
      const res = await fetch(`${BASE_URL}/bookings`, {
        headers: { Authorization: `Bearer ${merchantBToken}` },
      });
      const data = await res.json();
      if (!data.success || data.count !== 2) {
        throw new Error(`Expected 2 bookings in merchant dashboard, got ${data.count}`);
      }

      // 2. Confirm Booking and Assign Lead Photographer
      const resConfirm = await fetch(`${BASE_URL}/bookings/${createdBookingId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${merchantBToken}`,
        },
        body: JSON.stringify({
          bookingStatus: 'CONFIRMED',
          assignedStaffName: 'Vikram Rajput (Lead Cinematographer)',
          note: 'Dates locked with couple. Studio team notified.',
        }),
      });
      const dataConfirm = await resConfirm.json();
      if (!dataConfirm.success || dataConfirm.data.bookingStatus !== 'CONFIRMED') {
        throw new Error('Failed to confirm booking');
      }
      if (dataConfirm.data.assignedStaffName !== 'Vikram Rajput (Lead Cinematographer)') {
        throw new Error(`Staff assignment mismatch: ${dataConfirm.data.assignedStaffName}`);
      }

      // 3. Record Additional Advance Payment
      const resPay = await fetch(`${BASE_URL}/bookings/${createdBookingId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${merchantBToken}`,
        },
        body: JSON.stringify({
          advancePaid: 15000, // Total 15000 paid out of 25000
          note: 'Additional ₹10,000 token transferred via UPI',
        }),
      });
      const dataPay = await resPay.json();
      if (dataPay.data.advancePaid !== 15000 || dataPay.data.balanceDue !== 10000) {
        throw new Error(`Balance calculation mismatch: adv=${dataPay.data.advancePaid}, due=${dataPay.data.balanceDue}`);
      }
      if (dataPay.data.paymentStatus !== 'PARTIALLY_PAID') {
        throw new Error(`Expected PARTIALLY_PAID, got ${dataPay.data.paymentStatus}`);
      }
      if (dataPay.data.timeline.length < 3) {
        throw new Error(`Expected at least 3 audit timeline events, got ${dataPay.data.timeline.length}`);
      }
    });

    // 8. Booking KPIs & Revenue Statistics
    await test('8. Booking Analytics & Financial Reporting', async () => {
      const res = await fetch(`${BASE_URL}/bookings/stats`, {
        headers: { Authorization: `Bearer ${merchantBToken}` },
      });
      const data = await res.json();
      if (!data.success) throw new Error('Failed to fetch booking stats');
      if (data.data.totalBookings !== 2) throw new Error(`Expected 2 total bookings, got ${data.data.totalBookings}`);
      if (data.data.statusCounts.CONFIRMED !== 1) {
        throw new Error(`Expected 1 CONFIRMED booking, got ${data.data.statusCounts.CONFIRMED}`);
      }
      // 25000 (prewedding) + 8500 (baby) = 33500 total booked value
      if (data.data.finances.totalBookedValue !== 33500) {
        throw new Error(`Expected totalBookedValue ₹33500, got ₹${data.data.finances.totalBookedValue}`);
      }
    });

    // 9. Cross-Tenant IDOR Security Attack
    await test('9. Security: Cross-Tenant Booking IDOR Protection (Merchant A -> Merchant B booking)', async () => {
      // Merchant A attempts to fetch Merchant B's booking
      const resGet = await fetch(`${BASE_URL}/bookings/${createdBookingId}`, {
        headers: { Authorization: `Bearer ${merchantAToken}` },
      });
      if (resGet.status !== 404 && resGet.status !== 403) {
        throw new Error(`IDOR Leak! Merchant A fetched Merchant B's booking with status ${resGet.status}`);
      }

      // Merchant A attempts to tamper with Merchant B's booking
      const resPatch = await fetch(`${BASE_URL}/bookings/${createdBookingId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${merchantAToken}`,
        },
        body: JSON.stringify({ bookingStatus: 'CANCELLED' }),
      });
      if (resPatch.status !== 404 && resPatch.status !== 403) {
        throw new Error(`IDOR Tamper Leak! Merchant A altered Merchant B's booking with status ${resPatch.status}`);
      }
    });

    // 10. Multi-Phase Regression: Phase 1 (Auth), Phase 2 (CRM), Phase 3 (Meta CAPI), Phase 4 (Orders)
    await test('10. Multi-Phase Regression Across Phases 1, 2, 3, and 4', async () => {
      // Phase 1 regression
      const meRes = await fetch(`${BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${merchantBToken}` },
      });
      const meData = await meRes.json();
      if (!meData.success || meData.user.email !== 'vikram@royalfilms.com') {
        throw new Error('Phase 1 regression failed');
      }

      // Phase 2 regression: CRM stats
      const crmRes = await fetch(`${BASE_URL}/crm/stats`, {
        headers: { Authorization: `Bearer ${merchantBToken}` },
      });
      const crmData = await crmRes.json();
      if (!crmData.success || crmData.stats.totalLeads < 1) {
        throw new Error('Phase 2 CRM regression failed');
      }

      // Phase 3 regression: Meta settings
      const metaRes = await fetch(`${BASE_URL}/meta/settings`, {
        headers: { Authorization: `Bearer ${merchantBToken}` },
      });
      const metaData = await metaRes.json();
      if (!metaData.success || !metaData.settings.webhookUrl) {
        throw new Error('Phase 3 Meta Settings regression failed');
      }

      // Phase 4 regression: Product orders for Merchant A
      const orderRes = await fetch(`${BASE_URL}/orders`, {
        headers: { Authorization: `Bearer ${merchantAToken}` },
      });
      const orderData = await orderRes.json();
      if (!orderData.success) {
        throw new Error('Phase 4 Commerce Orders regression failed');
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
