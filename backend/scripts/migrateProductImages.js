// backend/scripts/migrateProductImages.js
// Converts legacy product image arrays (plain URL strings) into the
// { thumb, card, full } object format. Dry run by default; pass --apply.
//
// Safe to run more than once: products that are already migrated are skipped.

const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const mongoose = require('mongoose');
const Product = require('../src/models/Product');
const { normalizeProductImages } = require('../src/utils/productImages');

const run = async ({ apply = false } = {}) => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/omniva_saas', {
    serverSelectionTimeoutMS: 15000,
  });

  let scanned = 0;
  let migrated = 0;
  let skipped = 0;

  const cursor = Product.find({}).cursor();
  for await (const product of cursor) {
    scanned += 1;
    const images = Array.isArray(product.images) ? product.images : [];
    if (!images.length) continue;

    const needsMigration = images.some((image) => typeof image === 'string');
    if (!needsMigration) {
      skipped += 1;
      continue;
    }

    if (!apply) {
      console.log(`[dry-run] Product ${product._id}: ${images.length} legacy image(s) would be migrated`);
      continue;
    }

    // Assigning through the schema setter normalises the whole array.
    product.images = normalizeProductImages(images);
    await product.save();
    migrated += 1;
    console.log(`[migrated] Product ${product._id}`);
  }

  console.log('\n============================================================');
  console.log(`Scanned products: ${scanned}`);
  console.log(`Migrated: ${migrated}`);
  console.log(`Already migrated: ${skipped}`);
  console.log(
    apply
      ? 'Migration complete. Storefront image rendering is now size aware.'
      : 'Dry run complete. Re-run with --apply to write the migration.'
  );
  console.log('============================================================\n');

  await mongoose.disconnect();
};

if (require.main === module) {
  const apply = process.argv.includes('--apply');
  run({ apply })
    .then(() => process.exit(0))
    .catch(async (error) => {
      console.error('[Migrate Product Images] Fatal error:', error.message);
      try {
        await mongoose.disconnect();
      } catch {}
      process.exit(1);
    });
}

module.exports = { run };
