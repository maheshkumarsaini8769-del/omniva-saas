// backend/src/utils/cryptoUtils.js
// Cryptographic utilities for AES-256-GCM token encryption at rest,
// CSRF-protected OAuth state signing, and Meta webhook signature verification.

const crypto = require('crypto');

// Derive a 32-byte key for AES-256
const getEncryptionKey = () => {
  const secret =
    process.env.TOKEN_ENCRYPTION_KEY ||
    process.env.JWT_SECRET ||
    'omniva_default_token_encryption_key_32_bytes_min!';
  return crypto.createHash('sha256').update(String(secret)).digest();
};

/**
 * Encrypt a sensitive token using AES-256-GCM.
 * @param {string} plainText
 * @returns {string} Encrypted string in format: enc:gcm:<iv>:<tag>:<ciphertext>
 */
const encryptToken = (plainText) => {
  if (!plainText || typeof plainText !== 'string') return '';
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(12); // Recommended 12 bytes for GCM
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    let encrypted = cipher.update(plainText, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag().toString('hex');
    return `enc:gcm:${iv.toString('hex')}:${authTag}:${encrypted}`;
  } catch (err) {
    console.error('[cryptoUtils] Token encryption failed:', err.message);
    throw new Error('Failed to securely encrypt token at rest');
  }
};

/**
 * Decrypt an AES-256-GCM encrypted token.
 * Falls back to plain text if not encrypted (for backward compatibility).
 * @param {string} encryptedString
 * @returns {string} Plain text token
 */
const decryptToken = (encryptedString) => {
  if (!encryptedString || typeof encryptedString !== 'string') return '';
  if (!encryptedString.startsWith('enc:gcm:')) {
    return encryptedString; // Return legacy plaintext token safely
  }

  try {
    const parts = encryptedString.split(':');
    if (parts.length !== 5) {
      throw new Error('Malformed encrypted token format');
    }

    const [, , ivHex, tagHex, cipherHex] = parts;
    const key = getEncryptionKey();
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(tagHex, 'hex');

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(cipherHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (err) {
    console.error('[cryptoUtils] Token decryption failed:', err.message);
    throw new Error('Failed to decrypt token. Key may have changed or token is corrupted.');
  }
};

/**
 * Generate a cryptographically signed OAuth state token to prevent CSRF.
 * Encodes businessId and timestamp with HMAC-SHA256 signature.
 * @param {string} businessId
 * @returns {string} Base64url encoded signed state
 */
const generateOAuthState = (businessId) => {
  const timestamp = Date.now();
  const nonce = crypto.randomBytes(16).toString('hex');
  const payload = `${businessId}:${timestamp}:${nonce}`;

  const secret = process.env.META_APP_SECRET || process.env.JWT_SECRET || 'oauth_state_signing_secret';
  const hmac = crypto.createHmac('sha256', secret).update(payload).digest('hex');

  const stateData = `${payload}:${hmac}`;
  return Buffer.from(stateData).toString('base64url');
};

/**
 * Verify and decode an OAuth state token.
 * Validates HMAC signature and ensures state has not expired (TTL 30 minutes).
 * @param {string} stateString
 * @returns {string|null} businessId if valid, null if invalid or expired
 */
const verifyOAuthState = (stateString) => {
  if (!stateString || typeof stateString !== 'string') return null;

  try {
    const decoded = Buffer.from(stateString, 'base64url').toString('utf8');
    const parts = decoded.split(':');
    if (parts.length !== 4) return null;

    const [businessId, timestampStr, nonce, receivedHmac] = parts;
    const timestamp = parseInt(timestampStr, 10);

    // Enforce 30-minute state expiration window
    const MAX_AGE_MS = 30 * 60 * 1000;
    if (Date.now() - timestamp > MAX_AGE_MS || Date.now() < timestamp) {
      console.warn('[cryptoUtils] OAuth state expired or invalid timestamp');
      return null;
    }

    // Verify HMAC
    const payload = `${businessId}:${timestampStr}:${nonce}`;
    const secret = process.env.META_APP_SECRET || process.env.JWT_SECRET || 'oauth_state_signing_secret';
    const expectedHmac = crypto.createHmac('sha256', secret).update(payload).digest('hex');

    // Constant-time comparison to prevent timing attacks
    const hmacMatches = crypto.timingSafeEqual(
      Buffer.from(receivedHmac, 'hex'),
      Buffer.from(expectedHmac, 'hex')
    );

    if (!hmacMatches) {
      console.warn('[cryptoUtils] OAuth state HMAC signature mismatch');
      return null;
    }

    return businessId;
  } catch (err) {
    console.warn('[cryptoUtils] Failed to verify OAuth state:', err.message);
    return null;
  }
};

/**
 * Verify Meta Webhook authenticity using X-Hub-Signature-256 header.
 * @param {Buffer|string} rawBody
 * @param {string} signatureHeader (e.g. 'sha256=abcdef...')
 * @param {string} appSecret
 * @returns {boolean}
 */
const verifyMetaWebhookSignature = (rawBody, signatureHeader, appSecret) => {
  const secret = appSecret || process.env.META_APP_SECRET;
  if (!signatureHeader || !secret || !rawBody) return false;

  try {
    const [algo, receivedHash] = signatureHeader.split('=');
    if (algo !== 'sha256' || !receivedHash) return false;

    const expectedHash = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    const receivedBuf = Buffer.from(receivedHash, 'hex');
    const expectedBuf = Buffer.from(expectedHash, 'hex');
    if (receivedBuf.length !== expectedBuf.length) return false;

    return crypto.timingSafeEqual(receivedBuf, expectedBuf);
  } catch (err) {
    console.warn('[cryptoUtils] Webhook signature verification error:', err.message);
    return false;
  }
};

module.exports = {
  encryptToken,
  decryptToken,
  generateOAuthState,
  verifyOAuthState,
  verifyMetaWebhookSignature,
};
