// backend/scripts/encryptTenantSecrets.js
// One-time migration for legacy plaintext tenant integration credentials.
// Dry-run by default. Pass --apply to encrypt and save.
//
// The Tenant schema transparently decrypts legacy plaintext reads, but records
// written before this change remain plaintext until they are saved. Run this
// after setting the production TOKEN_ENCRYPTION_KEY and before going live.

const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const mongoose = require('mongoose');
const Tenant = require('../src/models/Tenant');
const { isEncryptedSecret, isMaskedSecret } = require('../src/utils/tenantSecrets');

const SECRET_PATHS = [
  ['settings', 'metaCapiToken'],
  ['integrations', 'meta', 'capiToken'],
  ['integrations', 'whatsapp', 'accessToken'],
  ['integrations', 'courier', 'apiKey'],
  ['integrations', 'courier', 'apiSecret'],
  ['integrations', 'payment', 'keySecret'],
  ['integrations', 'payment', 'webhookSecret'],
  ['integrations', 'webhooks', 'secret'],
];

const getPath = (value, parts) =>
  parts.reduce((current, key) => (current == null ? undefined : current[key]), value);

const redactMongoUri = (uri) => {
  try {
    const parsed = new URL(uri);
    return `${parsed.protocol}//${parsed.hostname}${parsed.port ? `:${parsed.port}` : ''}/${parsed.pathname.replace(/^\//, '')}`;
  } catch {
    return 'configured MongoDB database';
  }
};

const run = async ({ apply = false } = {}) => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/omniva_saas';
  const encryptionKeyConfigured = Boolean(process.env.TOKEN_ENCRYPTION_KEY);

  console.log('============================================================');
  console.log('--- TENANT SECRET ENCRYPTION MIGRATION ---');
  console.log(`Mode: ${apply ? 'APPLY' : 'DRY RUN (pass --apply to write)'}`);
  console.log(`Database: ${redactMongoUri(uri)}`);
  console.log(`TOKEN_ENCRYPTION_KEY configured: ${encryptionKeyConfigured ? 'yes' : 'NO (falling back to JWT_SECRET)'}`);
  console.log('============================================================\n');

  if (!encryptionKeyConfigured) {
    console.warn(
      '[WARN] TOKEN_ENCRYPTION_KEY is not set. Production must use a dedicated key, not JWT_SECRET.'
    );
    if (apply) {
      throw new Error(
        'Refusing to encrypt credentials without TOKEN_ENCRYPTION_KEY. Set the production key first.'
      );
    }
  }

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });

  let scanned = 0;
  let plaintextFields = 0;
  let updatedTenants = 0;
  let failedTenants = 0;

  const cursor = Tenant.find({}).cursor();
  for await (const tenant of cursor) {
    scanned += 1;
    const raw = tenant.toObject({ getters: false });
    const pending = [];

    for (const secretPath of SECRET_PATHS) {
      const value = getPath(raw, secretPath);
      if (
        typeof value === 'string' &&
        value.trim() &&
        !isEncryptedSecret(value) &&
        !isMaskedSecret(value)
      ) {
        pending.push([secretPath, value]);
      }
    }

    if (!pending.length) continue;
    plaintextFields += pending.length;

    if (!apply) {
      console.log(
        `[dry-run] Tenant ${tenant._id}: ${pending.length} plaintext credential field(s) would be encrypted`
      );
      continue;
    }

    try {
      for (const [secretPath, value] of pending) {
        tenant.set(secretPath.join('.'), value);
      }
      await tenant.save();
      updatedTenants += 1;
      console.log(
        `[updated] Tenant ${tenant._id}: encrypted ${pending.length} credential field(s)`
      );
    } catch (error) {
      failedTenants += 1;
      console.error(`[failed] Tenant ${tenant._id}: ${error.message}`);
    }
  }

  console.log('\n============================================================');
  console.log(`Scanned tenants: ${scanned}`);
  console.log(`Plaintext credential fields found: ${plaintextFields}`);
  console.log(`Tenants updated: ${updatedTenants}`);
  console.log(`Tenants failed: ${failedTenants}`);
  console.log(
    apply
      ? 'Migration complete. Verify login, Meta CAPI test, Razorpay webhook, and WhatsApp automation.'
      : 'Dry run complete. Re-run with --apply to encrypt the listed records.'
  );
  console.log('============================================================\n');

  await mongoose.disconnect();
  if (failedTenants > 0) process.exitCode = 1;
};

if (require.main === module) {
  const apply = process.argv.includes('--apply');
  run({ apply }).catch(async (error) => {
    console.error('[Encrypt Tenant Secrets] Fatal error:', error.message);
    try {
      await mongoose.disconnect();
    } catch {}
    process.exitCode = 1;
  });
}

module.exports = { SECRET_PATHS, run };
