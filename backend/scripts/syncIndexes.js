// Explicit index synchronisation for deployments where automatic index builds
// are disabled or unreliable (serverless, cold starts, restricted DB users).
// Usage: npm run db:sync-indexes
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const mongoose = require('mongoose');

const models = [
  'User',
  'Tenant',
  'Category',
  'Product',
  'Order',
  'Booking',
  'Lead',
  'Coupon',
  'ServicePackage',
  'Expense',
  'AutomationRule',
  'AutomationLog',
  'MetaIntegration',
];

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('[indexes] Connected to MongoDB');

    let failed = 0;
    for (const name of models) {
      try {
        // eslint-disable-next-line global-require, import/no-dynamic-require
        const model = require(`../src/models/${name}`);
        await model.createIndexes();
        console.log(`[indexes] OK   ${name}`);
      } catch (error) {
        failed += 1;
        console.error(`[indexes] FAIL ${name}: ${error.message}`);
      }
    }

    await mongoose.disconnect();
    console.log(`[indexes] Done. ${failed ? `${failed} model(s) failed.` : 'All indexes created.'}`);
    process.exit(failed ? 1 : 0);
  } catch (error) {
    console.error('[indexes] Fatal:', error.message);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
})();
