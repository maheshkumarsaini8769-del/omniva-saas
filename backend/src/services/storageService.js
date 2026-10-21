// backend/src/services/storageService.js
// Object storage for merchant media.
//
// Production driver: Cloudflare R2 (S3 compatible, 10GB free tier).
// Development/test driver: local disk.
//
// Both drivers expose the same API so the upload pipeline never branches on
// the driver:
//   uploadImage()      -> stores a buffer under a key
//   getPublicUrl()     -> URL for public assets (product images)
//   getPresignedUrl()  -> time limited URL for private reads
//   deleteImage()      -> removes a stored object
//
// Credentials are read from the environment only. Nothing is hardcoded and
// nothing is ever logged.

const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

const DEFAULT_PRESIGN_TTL_SECONDS = 3600; // 1 hour

const trimTrailingSlashes = (value) => String(value || '').trim().replace(/\/+$/, '');

const getR2Config = () => ({
  accountId: String(process.env.R2_ACCOUNT_ID || '').trim(),
  accessKeyId: String(process.env.R2_ACCESS_KEY_ID || '').trim(),
  secretAccessKey: String(process.env.R2_SECRET_ACCESS_KEY || '').trim(),
  bucketName: String(process.env.R2_BUCKET_NAME || '').trim(),
  publicUrl: trimTrailingSlashes(process.env.R2_PUBLIC_URL),
});

const isR2Configured = () => {
  const config = getR2Config();
  return Boolean(
    config.accountId &&
      config.accessKeyId &&
      config.secretAccessKey &&
      config.bucketName
  );
};

const getLocalStorageDir = () =>
  path.resolve(
    process.env.STORAGE_LOCAL_DIR || path.join(__dirname, '..', '..', 'storage')
  );

/**
 * Resolve the active driver.
 * STORAGE_DRIVER=r2|local forces a driver. Without it, R2 is used when it is
 * fully configured, otherwise the local disk driver is used.
 */
const getStorageDriver = () => {
  const forced = String(process.env.STORAGE_DRIVER || '').trim().toLowerCase();
  if (forced === 'r2' || forced === 'local') return forced;
  return isR2Configured() ? 'r2' : 'local';
};

const getStorageStatus = () => {
  const driver = getStorageDriver();
  if (driver === 'r2') {
    const config = getR2Config();
    return {
      driver: 'r2',
      configured: true,
      bucket: config.bucketName,
      publicBaseUrl: config.publicUrl,
    };
  }
  return {
    driver: 'local',
    configured: true,
    bucket: null,
    publicBaseUrl: '/storage',
    localDir: getLocalStorageDir(),
  };
};

let s3Client = null;
let s3Module = null;

const getS3Client = async () => {
  if (s3Client) return s3Client;
  if (!s3Module) {
    // Loaded lazily so a local-only deployment never needs the AWS SDK.
    // eslint-disable-next-line global-require, import/no-extraneous-dependencies
    s3Module = require('@aws-sdk/client-s3');
  }
  const config = getR2Config();
  if (!isR2Configured()) {
    throw new Error('Cloudflare R2 storage is not configured');
  }
  s3Client = new s3Module.S3Client({
    region: 'auto',
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
  return s3Client;
};

const getSigningSecret = () =>
  String(process.env.STORAGE_SIGNING_SECRET || process.env.JWT_SECRET || 'omniva-storage-signing');

const signLocalKey = (key, expiresAt) =>
  crypto
    .createHmac('sha256', getSigningSecret())
    .update(`${key}:${expiresAt}`)
    .digest('hex');

/**
 * Verify a local presigned URL signature.
 * @returns {boolean} true when the signature is valid and not expired
 */
const verifyLocalSignature = (key, expiresAt, signature) => {
  if (!expiresAt || !signature) return false;
  const expires = Number(expiresAt);
  if (!Number.isFinite(expires) || expires <= 0) return false;
  if (Date.now() > expires) return false;
  const expected = signLocalKey(key, expires);
  const received = Buffer.from(String(signature));
  const computed = Buffer.from(expected);
  if (received.length !== computed.length) return false;
  return crypto.timingSafeEqual(received, computed);
};

/**
 * Build a namespaced, collision-safe object key.
 * @param {String} businessId - Tenant that owns the asset
 * @param {String} folder - e.g. 'products'
 * @param {String} baseName - file name without extension
 * @param {String} variant - e.g. 'thumb', 'card', 'full', 'original'
 * @param {String} extension - file extension without the dot
 */
const buildObjectKey = ({ businessId, folder = 'products', baseName, variant, extension }) => {
  const safeFolder = String(folder || 'misc')
    .replace(/[^a-zA-Z0-9/_-]/g, '')
    .replace(/\/+/g, '/');
  const safeBase = String(baseName || 'file')
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .slice(0, 60);
  const safeVariant = String(variant || 'file').replace(/[^a-zA-Z0-9._-]/g, '-');
  const safeExt = String(extension || 'bin').replace(/[^a-zA-Z0-9]/g, '');
  const tenantPart = String(businessId || 'shared').replace(/[^a-zA-Z0-9]/g, '');
  return `${safeFolder}/${tenantPart}/${safeBase}-${safeVariant}.${safeExt}`;
};

/**
 * Store a buffer and return the stored key plus its public URL.
 */
const uploadImage = async ({ buffer, key, contentType = 'application/octet-stream', cacheControl }) => {
  if (!buffer || !buffer.length) {
    throw new Error('Nothing to upload');
  }
  if (!key) {
    throw new Error('A storage key is required');
  }

  const driver = getStorageDriver();

  if (driver === 'r2') {
    const client = await getS3Client();
    const config = getR2Config();
    // eslint-disable-next-line global-require, import/no-extraneous-dependencies
    const { PutObjectCommand } = require('@aws-sdk/client-s3');
    await client.send(
      new PutObjectCommand({
        Bucket: config.bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        CacheControl: cacheControl || 'public, max-age=31536000, immutable',
      })
    );
    return {
      driver: 'r2',
      key,
      url: `${config.publicUrl}/${key}`,
      size: buffer.length,
    };
  }

  const targetPath = path.join(getLocalStorageDir(), key);
  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  await fs.writeFile(targetPath, buffer);
  return {
    driver: 'local',
    key,
    url: `/storage/${key}`,
    size: buffer.length,
  };
};

/**
 * Public URL for an object. Product images are served from a public bucket,
 * so the URL is stable and cacheable.
 */
const getPublicUrl = (key) => {
  if (!key) return '';
  const driver = getStorageDriver();
  if (driver === 'r2') {
    const config = getR2Config();
    return config.publicUrl ? `${config.publicUrl}/${key}` : '';
  }
  return `/storage/${key}`;
};

/**
 * Time limited URL for private reads (1 hour by default).
 */
const getPresignedUrl = async (key, { expiresIn = DEFAULT_PRESIGN_TTL_SECONDS } = {}) => {
  if (!key) return '';
  const driver = getStorageDriver();
  const ttl = Math.max(60, Number(expiresIn) || DEFAULT_PRESIGN_TTL_SECONDS);

  if (driver === 'r2') {
    const client = await getS3Client();
    const config = getR2Config();
    // eslint-disable-next-line global-require, import/no-extraneous-dependencies
    const { GetObjectCommand } = require('@aws-sdk/client-s3');
    // eslint-disable-next-line global-require, import/no-extraneous-dependencies
    const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
    return getSignedUrl(
      client,
      new GetObjectCommand({ Bucket: config.bucketName, Key: key }),
      { expiresIn: ttl }
    );
  }

  const expiresAt = Date.now() + ttl * 1000;
  return `${getPublicUrl(key)}?exp=${expiresAt}&sig=${signLocalKey(key, expiresAt)}`;
};

/**
 * Remove a stored object. Missing objects are not an error.
 */
const deleteImage = async (key) => {
  if (!key) return { deleted: false };
  const driver = getStorageDriver();

  if (driver === 'r2') {
    const client = await getS3Client();
    const config = getR2Config();
    // eslint-disable-next-line global-require, import/no-extraneous-dependencies
    const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
    await client.send(new DeleteObjectCommand({ Bucket: config.bucketName, Key: key }));
    return { deleted: true, driver: 'r2' };
  }

  const targetPath = path.join(getLocalStorageDir(), key);
  try {
    await fs.unlink(targetPath);
    return { deleted: true, driver: 'local' };
  } catch (error) {
    if (error.code === 'ENOENT') return { deleted: false, driver: 'local' };
    throw error;
  }
};

/**
 * Remove every object under a prefix (used when a product is deleted).
 */
const deletePrefix = async (prefix) => {
  if (!prefix) return { deleted: 0 };
  const driver = getStorageDriver();

  if (driver === 'r2') {
    const client = await getS3Client();
    const config = getR2Config();
    // eslint-disable-next-line global-require, import/no-extraneous-dependencies
    const { ListObjectsV2Command, DeleteObjectCommand } = require('@aws-sdk/client-s3');
    let deleted = 0;
    let continuationToken;
    do {
      const listed = await client.send(
        new ListObjectsV2Command({
          Bucket: config.bucketName,
          Prefix: prefix,
          ContinuationToken: continuationToken,
        })
      );
      for (const object of listed.Contents || []) {
        await client.send(
          new DeleteObjectCommand({ Bucket: config.bucketName, Key: object.Key })
        );
        deleted += 1;
      }
      continuationToken = listed.IsTruncated ? listed.NextContinuationToken : undefined;
    } while (continuationToken);
    return { deleted };
  }

  const root = getLocalStorageDir();
  const targetDir = path.join(root, prefix);
  let deleted = 0;
  const walk = async (dir) => {
    let entries = [];
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch (error) {
      if (error.code === 'ENOENT') return;
      throw error;
    }
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(full);
      } else {
        await fs.unlink(full);
        deleted += 1;
      }
    }
  };
  await walk(targetDir);
  return { deleted };
};

module.exports = {
  DEFAULT_PRESIGN_TTL_SECONDS,
  buildObjectKey,
  deleteImage,
  deletePrefix,
  getLocalStorageDir,
  getPresignedUrl,
  getPublicUrl,
  getSigningSecret,
  getStorageDriver,
  getStorageStatus,
  isR2Configured,
  signLocalKey,
  uploadImage,
  verifyLocalSignature,
};
