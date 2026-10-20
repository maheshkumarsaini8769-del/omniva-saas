// backend/src/config/env.js
// Validate required environment variables at startup.
// Development only warns; production fails fast on missing or default secrets.

const REQUIRED_IN_PRODUCTION = [
  'MONGODB_URI',
  'JWT_SECRET',
  'TOKEN_ENCRYPTION_KEY',
  'RAZORPAY_WEBHOOK_SECRET',
  'META_WEBHOOK_VERIFY_TOKEN',
  'MASTER_SETUP_KEY',
];

const RECOMMENDED = [
  'CLIENT_URL',
  'META_APP_ID',
  'META_APP_SECRET',
  'META_REDIRECT_URI',
  'TOKEN_ENCRYPTION_KEY',
];

const INSECURE_DEFAULTS = {
  JWT_SECRET: [
    'omniva_default_secret_key_change_in_prod',
    'omniva_super_secret_jwt_key_2026_production_ready',
    'change_me_to_a_random_jwt_secret_for_production',
  ],
  TOKEN_ENCRYPTION_KEY: ['omniva_secure_token_encryption_key_2026_aes_gcm'],
  RAZORPAY_WEBHOOK_SECRET: ['omniva_rzp_secret_2026'],
  META_WEBHOOK_VERIFY_TOKEN: ['omniva_meta_verify_token_2026'],
  MASTER_SETUP_KEY: ['omniva_master_setup_secret_2026'],
};

function validateEnv() {
  if (process.env.NODE_ENV !== 'production') {
    const missing = RECOMMENDED.filter((key) => !process.env[key]);
    if (missing.length) {
      console.warn('[env] Missing recommended env vars:', missing.join(', '));
    }
    return;
  }

  const missing = REQUIRED_IN_PRODUCTION.filter((key) => !process.env[key]);
  if (missing.length) {
    console.error('[env] FATAL: missing required env vars in production:', missing.join(', '));
    process.exit(1);
  }

  for (const [key, insecureValues] of Object.entries(INSECURE_DEFAULTS)) {
    if (insecureValues.includes(process.env[key])) {
      console.error(`[env] FATAL: ${key} is using a documented insecure default. Set a unique secret.`);
      process.exit(1);
    }
  }

  // Catch values copied straight from .env.example
  for (const key of REQUIRED_IN_PRODUCTION) {
    const value = String(process.env[key] || '');
    if (/^(change[_-]?me|replace_with_|your_|example|placeholder|<.*>$)/i.test(value)) {
      console.error(`[env] FATAL: ${key} still contains an example placeholder value.`);
      process.exit(1);
    }
  }
}

module.exports = { validateEnv };
