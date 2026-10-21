// backend/src/utils/tenantSecrets.js
// Helpers for tenant integration credentials:
// - encrypt sensitive fields at rest in the Tenant document
// - mask secrets before any API response
// - detect masked placeholders so a UI round-trip never overwrites a real secret

const { encryptToken, decryptToken } = require('./cryptoUtils');

const SECRET_MASK = '••••••••';
const SECRET_KEY_NAMES = new Set([
  'metaCapiToken',
  'capiToken',
  'accessToken',
  'apiKey',
  'apiSecret',
  'keySecret',
  'webhookSecret',
  'secret',
]);

const isMaskedSecret = (value) =>
  typeof value === 'string' && value.includes('••••');

const isEncryptedSecret = (value) =>
  typeof value === 'string' && value.startsWith('enc:gcm:');

const isBlankSecret = (value) =>
  value === undefined || value === null || (typeof value === 'string' && value.trim() === '');

// Mongoose path definition for a secret string. Existing plaintext values keep
// working through decryptToken's legacy fallback; new writes are encrypted.
const encryptedStringField = {
  type: String,
  default: '',
  set: (value) => {
    if (value === undefined || value === null) return '';
    const text = String(value).trim();
    if (!text || isEncryptedSecret(text) || isMaskedSecret(text)) return text;
    return encryptToken(text);
  },
  get: (value) => {
    if (!value || typeof value !== 'string') return '';
    try {
      return decryptToken(value);
    } catch {
      // A wrong/rotated key must fail closed rather than break every tenant read.
      return '';
    }
  },
};

const redactSecretValues = (value) => {
  if (Array.isArray(value)) return value.map(redactSecretValues);
  if (!value || typeof value !== 'object') return value;
  if (value instanceof Date || Buffer.isBuffer(value) || value._bsontype) return value;

  const redacted = {};
  for (const [key, child] of Object.entries(value)) {
    if (SECRET_KEY_NAMES.has(key)) {
      redacted[key] = child ? SECRET_MASK : '';
    } else {
      redacted[key] = redactSecretValues(child);
    }
  }
  return redacted;
};

// Convert a Tenant document/plain object to a response-safe object. Getters are
// intentionally disabled so encrypted values are never decrypted just to be
// replaced by a mask.
const redactTenantSecrets = (tenant) => {
  if (!tenant) return tenant;
  const plain =
    typeof tenant.toObject === 'function'
      ? tenant.toObject({ getters: false, virtuals: false, depopulate: true })
      : tenant;
  return redactSecretValues(plain);
};

const redactIntegrationSecrets = (integrations) =>
  redactSecretValues(integrations || {});

// Merge an incoming integrations patch without letting blank/masked UI values
// erase stored credentials. Non-secret fields (including explicit empty
// strings) are still updated.
const mergeTenantIntegrations = (existing, incoming) => {
  const merged = { ...(existing || {}) };
  if (!incoming || typeof incoming !== 'object' || Array.isArray(incoming)) {
    return merged;
  }

  for (const [sectionKey, patch] of Object.entries(incoming)) {
    if (['__proto__', 'constructor', 'prototype'].includes(sectionKey)) continue;
    if (!patch || typeof patch !== 'object' || Array.isArray(patch)) {
      if (sectionKey === 'managedBySuperAdmin') merged[sectionKey] = Boolean(patch);
      continue;
    }

    const section = { ...(merged[sectionKey] || {}) };
    for (const [field, value] of Object.entries(patch)) {
      if (['__proto__', 'constructor', 'prototype'].includes(field)) continue;
      if (value === undefined) continue;
      if (SECRET_KEY_NAMES.has(field) && (isBlankSecret(value) || isMaskedSecret(value))) {
        continue;
      }
      section[field] = value;
    }
    merged[sectionKey] = section;
  }

  return merged;
};

module.exports = {
  SECRET_MASK,
  encryptedStringField,
  isBlankSecret,
  isEncryptedSecret,
  isMaskedSecret,
  mergeTenantIntegrations,
  redactIntegrationSecrets,
  redactTenantSecrets,
};
