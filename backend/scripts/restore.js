const mongoose = require('mongoose');
const { EJSON, ObjectId } = require('bson');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Legacy snapshots were written with JSON.stringify, so ObjectId and Date
// values became plain strings. New snapshots use EJSON. Convert only known
// reference/date fields for legacy files so a restore does not silently break
// tenant scoping.
const LEGACY_OBJECT_ID_FIELDS = new Set([
  '_id',
  'businessId',
  'tenantId',
  'userId',
  'productId',
  'packageId',
  'orderId',
  'leadId',
  'bookingId',
  'staffId',
  'customerId',
  'assignedTo',
  'createdBy',
  'updatedBy',
]);

const LEGACY_DATE_FIELDS = new Set([
  'createdAt',
  'updatedAt',
  'timestamp',
  'eventDate',
  'expiresAt',
  'lastSyncedAt',
  'subscribedAt',
  'currentPeriodStart',
  'currentPeriodEnd',
  'trialEndsAt',
  'lastBackupAt',
  'sentAt',
  'scheduledAt',
  'completedAt',
  'dueDate',
  'nextFollowUpAt',
]);

const reviveLegacyValue = (value, fieldName = '') => {
  if (Array.isArray(value)) {
    return value.map((entry) => reviveLegacyValue(entry, fieldName));
  }
  if (value && typeof value === 'object') {
    const revived = {};
    for (const [key, entry] of Object.entries(value)) {
      revived[key] = reviveLegacyValue(entry, key);
    }
    return revived;
  }
  if (typeof value === 'string') {
    if (LEGACY_OBJECT_ID_FIELDS.has(fieldName) && /^[a-f0-9]{24}$/i.test(value)) {
      return new ObjectId(value);
    }
    if (LEGACY_DATE_FIELDS.has(fieldName)) {
      const parsed = new Date(value);
      if (!Number.isNaN(parsed.getTime())) return parsed;
    }
  }
  return value;
};

const parseSnapshotFile = (filePath) => {
  const raw = fs.readFileSync(filePath, 'utf8');
  if (raw.trim() === '') return [];
  const ejsonMarkers = ['"$oid"', '"$date"', '"$binary"', '"$numberLong"', '"$decimal"', '"$uuid"'];
  const text = ejsonMarkers.some((marker) => raw.includes(marker)) ? raw : null;
  if (text) return EJSON.parse(text, { relaxed: false });

  console.warn(
    `[Omniva Restore] ${path.basename(filePath)} is a legacy JSON snapshot; applying reference/date revival.`
  );
  return reviveLegacyValue(JSON.parse(raw));
};

const parseArgs = (argv) => {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith('--')) continue;
    const key = arg.slice(2);
    if (key === 'yes' || key === 'drop' || key === 'help') {
      args[key] = true;
    } else {
      const value = argv[index + 1];
      if (!value || value.startsWith('--')) {
        throw new Error(`Missing value for --${key}`);
      }
      args[key] = value;
      index += 1;
    }
  }
  return args;
};

const chunk = (items, size) => {
  const chunks = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
};

const redactUri = (uri) =>
  String(uri || '').replace(/\/\/([^:@/]+):([^@/]+)@/, '//$1:***@');

/**
 * Restore an Omniva snapshot into a MongoDB database.
 *
 * Safety defaults:
 * - The target must be explicitly passed or present in MONGODB_URI.
 * - --yes is mandatory.
 * - Non-empty target collections are refused unless --drop is supplied.
 */
const restoreSnapshot = async ({ snapshotDir, uri, drop = false, yes = false } = {}) => {
  if (!snapshotDir) throw new Error('A snapshot directory is required');
  const resolvedSnapshot = path.resolve(snapshotDir);
  if (!fs.existsSync(resolvedSnapshot)) {
    throw new Error(`Snapshot directory not found: ${resolvedSnapshot}`);
  }
  if (!yes) {
    throw new Error('Restore requires --yes. This operation writes to a database.');
  }

  const targetUri = uri || process.env.MONGODB_URI;
  if (!targetUri) throw new Error('No target MongoDB URI supplied');

  const manifestPath = path.join(resolvedSnapshot, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    throw new Error('Snapshot manifest.json is missing; refusing an unverified restore');
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  console.log(
    `[Omniva Restore] Snapshot: ${manifest.timestamp || 'unknown'} | format: ${manifest.format || 'legacy JSON'}`
  );
  console.log(`[Omniva Restore] Target: ${redactUri(targetUri)}`);

  await mongoose.connect(targetUri);
  const db = mongoose.connection.db;

  const files = fs
    .readdirSync(resolvedSnapshot)
    .filter((name) => name.endsWith('.json') && name !== 'manifest.json')
    .sort();

  let restoredDocuments = 0;
  const restoredCollections = [];

  for (const fileName of files) {
    const collectionName = fileName.slice(0, -'.json'.length);
    if (collectionName.startsWith('.') || collectionName === 'system.indexes') continue;

    const docs = parseSnapshotFile(path.join(resolvedSnapshot, fileName));
    if (!Array.isArray(docs)) {
      throw new Error(`Snapshot file ${fileName} did not contain an array`);
    }
    if (docs.length === 0) {
      console.log(`  - ${collectionName}: empty, skipped`);
      continue;
    }

    const collection = db.collection(collectionName);
    const beforeCount = await collection.estimatedDocumentCount();
    if (beforeCount > 0 && !drop) {
      throw new Error(
        `Collection ${collectionName} already has ${beforeCount} document(s). Re-run with --drop to replace it.`
      );
    }
    if (drop && beforeCount > 0) {
      await collection.deleteMany({});
    }

    for (const batch of chunk(docs, 500)) {
      await collection.insertMany(batch, { ordered: true });
    }

    const afterCount = await collection.countDocuments({});
    if (afterCount < docs.length) {
      throw new Error(
        `Restore verification failed for ${collectionName}: expected at least ${docs.length}, found ${afterCount}`
      );
    }

    restoredDocuments += docs.length;
    restoredCollections.push(collectionName);
    console.log(`  ✓ ${collectionName}: ${docs.length} document(s) restored`);
  }

  if (Number(manifest.totalDocuments) > 0 && restoredDocuments !== Number(manifest.totalDocuments)) {
    console.warn(
      `[Omniva Restore] Warning: manifest lists ${manifest.totalDocuments} documents but ${restoredDocuments} were restored.`
    );
  }

  // A quick referential smoke test: tenants and their users must resolve.
  if (restoredCollections.includes('tenants') && restoredCollections.includes('users')) {
    const tenantSample = await db.collection('tenants').findOne({});
    if (tenantSample?._id) {
      const users = await db.collection('users').countDocuments({ businessId: tenantSample._id });
      console.log(`[Omniva Restore] Smoke check: ${users} user(s) linked to tenant ${tenantSample._id}`);
    }
  }

  await mongoose.disconnect();
  console.log(
    `[Omniva Restore] Completed: ${restoredDocuments} document(s) across ${restoredCollections.length} collection(s).`
  );
  console.log('[Omniva Restore] Run `npm run db:sync-indexes` against the target before serving traffic.');

  return { restoredDocuments, restoredCollections };
};

if (require.main === module) {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(
      'Usage: node scripts/restore.js --snapshot <dir> --yes [--drop] [--uri <mongodb-uri>]'
    );
    process.exit(0);
  }
  restoreSnapshot({
    snapshotDir: args.snapshot,
    uri: args.uri,
    drop: Boolean(args.drop),
    yes: Boolean(args.yes),
  }).catch((error) => {
    console.error('[Omniva Restore Error]:', error.message);
    process.exitCode = 1;
  });
}

module.exports = { restoreSnapshot, parseSnapshotFile, reviveLegacyValue };
