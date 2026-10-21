process.env.NODE_ENV = 'test';
process.env.DISABLE_RATE_LIMIT = 'true';

const path = require('path');
const os = require('os');
const fs = require('fs');
const http = require('http');
const { once } = require('events');
const crypto = require('crypto');

// The local disk storage driver is used so the full upload pipeline (multer ->
// sharp -> storage) is exercised without a Cloudflare account. The directory is
// a disposable temp folder that is removed at the end of the run.
const STORAGE_DIR = path.join(os.tmpdir(), `omniva-phase12-${Date.now().toString(36)}`);
process.env.STORAGE_DRIVER = 'local';
process.env.STORAGE_LOCAL_DIR = STORAGE_DIR;

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const sharp = require('sharp');
const mongoose = require('mongoose');
const { app } = require('../src/server');
const Tenant = require('../src/models/Tenant');
const User = require('../src/models/User');
const Product = require('../src/models/Product');
const { getImageUrl } = require('../src/utils/productImages');
const { getStorageDriver } = require('../src/services/storageService');

const PORT = 5112;
const BASE = `http://127.0.0.1:${PORT}/api`;
const stamp = Date.now().toString(36);
const createdTenantIds = [];
const createdUserIds = [];
const createdProductIds = [];

let passed = 0;
let failed = 0;

const check = (name, condition, detail = '') => {
  if (condition) {
    passed += 1;
    console.log(`[PASS] ${name}`);
  } else {
    failed += 1;
    console.log(`[FAIL] ${name}${detail ? ` — ${detail}` : ''}`);
  }
};

const request = async (method, endpoint, { token, body, headers: extraHeaders = {} } = {}) => {
  const headers = { ...extraHeaders };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${BASE}${endpoint}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let data = null;
  try {
    data = await response.json();
  } catch {}
  return { status: response.status, data };
};

const uploadFile = async (token, { buffer, filename = 'photo.jpg', type = 'image/jpeg' }) => {
  const form = new FormData();
  form.append('image', new Blob([buffer], { type }), filename);
  const response = await fetch(`${BASE}/upload/product-image`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  let data = null;
  try {
    data = await response.json();
  } catch {}
  return { status: response.status, data };
};

const login = async (email, password = 'ProbePass123!') => {
  const response = await request('POST', '/auth/login', { body: { email, password } });
  if (response.status !== 200 || !response.data?.token) {
    throw new Error(`Login failed for ${email}: ${response.status} ${response.data?.message || ''}`);
  }
  return response.data.token;
};

const createTenant = async (label) => {
  const tenant = await Tenant.create({
    businessName: `Phase12 ${label} ${stamp}`,
    slug: `phase12-${label}-${stamp}-${crypto.randomInt(1000, 999999)}`,
    businessType: 'PRODUCT',
    templateCode: 'PRODUCT',
    status: 'ACTIVE',
    planTier: 'PRO',
  });
  createdTenantIds.push(tenant._id);
  return tenant;
};

const createUser = async (tenant, label, role = 'MERCHANT_OWNER') => {
  const user = await User.create({
    name: `Phase12 ${role} ${label}`,
    email: `phase12-${label}-${stamp}@example.com`,
    password: 'ProbePass123!',
    role,
    businessId: tenant._id,
  });
  createdUserIds.push(user._id);
  return user;
};

const makeImage = async (width = 1500, height = 1500) =>
  sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 32, g: 99, b: 235 },
    },
  })
    .jpeg()
    .toBuffer();

const cleanup = async () => {
  try {
    if (createdTenantIds.length) {
      await Product.deleteMany({ businessId: { $in: createdTenantIds } });
      await User.deleteMany({ businessId: { $in: createdTenantIds } });
      await Tenant.deleteMany({ _id: { $in: createdTenantIds } });
    }
    if (createdUserIds.length) await User.deleteMany({ _id: { $in: createdUserIds } });
    if (createdProductIds.length) await Product.deleteMany({ _id: { $in: createdProductIds } });
  } catch (error) {
    console.error('[Phase12 Cleanup Warning]', error.message);
  }
  try {
    await fs.promises.rm(STORAGE_DIR, { recursive: true, force: true });
  } catch {}
};

const run = async () => {
  console.log('\n============================================================');
  console.log('--- STARTING PHASE 12 IMAGE UPLOAD REGRESSION ---');
  console.log('============================================================\n');

  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/omniva_saas';
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 15000 });

  const server = app.listen(PORT, '127.0.0.1');
  await once(server, 'listening');

  try {
    check(
      'The local disk storage driver is active for this run',
      getStorageDriver() === 'local',
      getStorageDriver()
    );

    const tenant = await createTenant('upload');
    const owner = await createUser(tenant, 'owner');
    const inventory = await createUser(tenant, 'inventory', 'INVENTORY_STAFF');
    const orderManager = await createUser(tenant, 'order', 'ORDER_MANAGER');
    const marketing = await createUser(tenant, 'marketing', 'MARKETING_STAFF');
    const support = await createUser(tenant, 'support', 'SUPPORT_STAFF');
    const [ownerToken, inventoryToken, orderToken, marketingToken, supportToken] =
      await Promise.all([
        login(owner.email),
        login(inventory.email),
        login(orderManager.email),
        login(marketing.email),
        login(support.email),
      ]);

    // ---------------------------------------------------------------------
    // 1. Happy path: one upload produces three webp sizes plus the original
    // ---------------------------------------------------------------------
    const sourceImage = await makeImage(1500, 1500);
    const upload = await uploadFile(ownerToken, { buffer: sourceImage });
    const data = upload.data?.data || {};

    check(
      'Upload succeeds and returns thumb, card, full and original variants',
      upload.status === 201 &&
        Boolean(data.thumb?.url) &&
        Boolean(data.card?.url) &&
        Boolean(data.full?.url) &&
        Boolean(data.original?.url),
      `status=${upload.status} ${upload.data?.message || ''}`
    );

    const variantSizes = {};
    let exifStripped = true;
    for (const variant of ['thumb', 'card', 'full']) {
      const filePath = path.join(STORAGE_DIR, String(data[variant]?.key || ''));
      if (!fs.existsSync(filePath)) {
        variantSizes[variant] = null;
        continue;
      }
      const meta = await sharp(filePath).metadata();
      variantSizes[variant] = { width: meta.width, height: meta.height, format: meta.format };
      if (meta.exif || meta.orientation) exifStripped = false;
    }

    check(
      'The three size variants are generated as WebP with the right dimensions',
      variantSizes.thumb?.width === 200 &&
        variantSizes.thumb?.height === 200 &&
        variantSizes.card?.width === 600 &&
        variantSizes.card?.height === 600 &&
        variantSizes.full?.width === 1200 &&
        variantSizes.full?.height === 1200 &&
        variantSizes.thumb?.format === 'webp' &&
        variantSizes.card?.format === 'webp' &&
        variantSizes.full?.format === 'webp',
      JSON.stringify(variantSizes)
    );
    check('EXIF metadata is not carried into the processed images', exifStripped);
    check(
      'Stored objects are namespaced under the owning tenant',
      String(data.full?.key || '').startsWith(`products/${tenant._id}/`),
      String(data.full?.key || '')
    );

    // ---------------------------------------------------------------------
    // 2. Failure modes
    // ---------------------------------------------------------------------
    const tooLarge = await uploadFile(ownerToken, {
      buffer: Buffer.alloc(6 * 1024 * 1024, 7),
      filename: 'big.jpg',
    });
    check(
      'A file larger than 5MB is rejected with 413',
      tooLarge.status === 413,
      `status=${tooLarge.status}`
    );

    const wrongType = await uploadFile(ownerToken, {
      buffer: Buffer.from('MZ binary payload'),
      filename: 'payload.exe',
      type: 'application/x-msdownload',
    });
    check(
      'A non-image file is rejected with 400',
      wrongType.status === 400,
      `status=${wrongType.status}`
    );

    const corruptImage = await uploadFile(ownerToken, {
      buffer: Buffer.from('this is definitely not an image'),
      filename: 'broken.jpg',
    });
    check(
      'A corrupt image is rejected with 400',
      corruptImage.status === 400,
      `status=${corruptImage.status}`
    );

    const noFile = await uploadFile(ownerToken, { buffer: Buffer.alloc(0) });
    check('An empty upload is rejected with 400', noFile.status === 400, `status=${noFile.status}`);

    // ---------------------------------------------------------------------
    // 3. Permission matrix
    // ---------------------------------------------------------------------
    const smallImage = await makeImage(64, 64);
    const inventoryUpload = await uploadFile(inventoryToken, { buffer: smallImage });
    const orderUpload = await uploadFile(orderToken, { buffer: smallImage });
    const marketingUpload = await uploadFile(marketingToken, { buffer: smallImage });
    const supportUpload = await uploadFile(supportToken, { buffer: smallImage });
    const anonymousUpload = await uploadFile(null, { buffer: smallImage });
    check(
      'Upload matrix: owner and inventory staff allowed, order/marketing/support denied',
      inventoryUpload.status === 201 &&
        orderUpload.status === 403 &&
        marketingUpload.status === 403 &&
        supportUpload.status === 403 &&
        anonymousUpload.status === 401,
      `inventory=${inventoryUpload.status}, order=${orderUpload.status}, marketing=${marketingUpload.status}, support=${supportUpload.status}, anonymous=${anonymousUpload.status}`
    );

    // ---------------------------------------------------------------------
    // 4. Tenant isolation for stored objects
    // ---------------------------------------------------------------------
    const otherTenant = await createTenant('other');
    const otherOwner = await createUser(otherTenant, 'other-owner');
    const otherToken = await login(otherOwner.email);
    const foreignDelete = await request('DELETE', '/upload/product-image', {
      token: otherToken,
      body: { key: data.full?.key },
    });
    check(
      "A tenant cannot delete another tenant's stored image",
      foreignDelete.status === 403,
      `status=${foreignDelete.status}`
    );

    // ---------------------------------------------------------------------
    // 5. Product with an uploaded image
    // ---------------------------------------------------------------------
    const createProduct = await request('POST', '/products', {
      token: ownerToken,
      body: {
        name: `Phase12 Product ${stamp}`,
        slug: `phase12-product-${stamp}`,
        price: 499,
        stockQuantity: 5,
        images: [
          {
            thumb: data.thumb?.url,
            card: data.card?.url,
            full: data.full?.url,
            key: data.full?.key,
            storageKeys: {
              thumb: data.thumb?.key,
              card: data.card?.key,
              full: data.full?.key,
              original: data.original?.key,
            },
          },
        ],
      },
    });
    const productId = createProduct.data?.data?._id;
    if (productId) createdProductIds.push(productId);
    const productImages = createProduct.data?.data?.images || [];
    check(
      'A product created with an uploaded image stores the size variants',
      createProduct.status === 201 &&
        productImages[0]?.thumb === data.thumb?.url &&
        productImages[0]?.card === data.card?.url &&
        productImages[0]?.full === data.full?.url,
      JSON.stringify(productImages)
    );

    const storeRes = await request('GET', `/public/store/${tenant.slug}`);
    const storeProduct = (storeRes.data?.data?.products || []).find(
      (p) => String(p._id) === String(productId)
    );
    const storefrontImage = getImageUrl(storeProduct?.images, 'card');
    check(
      'The public storefront serves the card size for the product',
      storeRes.status === 200 && storefrontImage === data.card?.url,
      storefrontImage || 'no image'
    );

    const legacyProduct = await request('POST', '/products', {
      token: ownerToken,
      body: {
        name: `Phase12 Legacy ${stamp}`,
        slug: `phase12-legacy-${stamp}`,
        price: 199,
        stockQuantity: 2,
        images: ['https://images.example.com/legacy.jpg'],
      },
    });
    const legacyImages = legacyProduct.data?.data?.images || [];
    check(
      'A legacy image URL is normalised to the size object format',
      legacyProduct.status === 201 &&
        legacyImages[0]?.full === 'https://images.example.com/legacy.jpg' &&
        legacyImages[0]?.thumb === 'https://images.example.com/legacy.jpg',
      JSON.stringify(legacyImages)
    );

    // ---------------------------------------------------------------------
    // 6. Deleting a product removes its stored images
    // ---------------------------------------------------------------------
    const fullKey = data.full?.key;
    const deleteProduct = await request('DELETE', `/products/${productId}`, {
      token: ownerToken,
    });
    await new Promise((resolve) => setTimeout(resolve, 400));
    check(
      'Deleting a product removes its stored image objects',
      deleteProduct.status === 200 && fullKey && !fs.existsSync(path.join(STORAGE_DIR, fullKey)),
      `status=${deleteProduct.status}, exists=${fullKey ? fs.existsSync(path.join(STORAGE_DIR, fullKey)) : 'n/a'}`
    );

    // ---------------------------------------------------------------------
    // 7. Orphan upload can be removed by the owner
    // ---------------------------------------------------------------------
    const orphan = await uploadFile(ownerToken, { buffer: smallImage });
    const orphanKey = orphan.data?.data?.full?.key;
    const deleteOrphan = await request('DELETE', '/upload/product-image', {
      token: ownerToken,
      body: { key: orphanKey },
    });
    check(
      'An upload that was never attached to a product can be deleted',
      deleteOrphan.status === 200 &&
        orphanKey &&
        !fs.existsSync(path.join(STORAGE_DIR, orphanKey)),
      `status=${deleteOrphan.status}`
    );

    // ---------------------------------------------------------------------
    // 8. Per tenant upload quota
    // ---------------------------------------------------------------------
    const quotaTenant = await createTenant('quota');
    const quotaOwner = await createUser(quotaTenant, 'quota-owner');
    const quotaToken = await login(quotaOwner.email);

    let quotaStatuses = [];
    for (let index = 0; index < 21; index += 1) {
      // eslint-disable-next-line no-await-in-loop
      const result = await uploadFile(quotaToken, { buffer: smallImage });
      quotaStatuses.push(result.status);
    }
    const limited = quotaStatuses.filter((status) => status === 429).length;
    check(
      'The 21st upload in an hour is rejected with 429 for that tenant',
      quotaStatuses[0] === 201 && quotaStatuses[20] === 429 && limited === 1,
      quotaStatuses.join(',')
    );

    const otherTenantUpload = await uploadFile(otherToken, { buffer: smallImage });
    check(
      'The upload quota of one tenant does not block another tenant',
      otherTenantUpload.status === 201,
      `status=${otherTenantUpload.status}`
    );
  } catch (error) {
    failed += 1;
    console.error('[Phase12 Fatal Error]', error);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await cleanup();
    await mongoose.disconnect();
  }

  console.log('\n============================================================');
  console.log(`--- PHASE 12 RESULT: ${passed} passed, ${failed} failed ---`);
  console.log('============================================================\n');
  if (failed > 0) process.exitCode = 1;
};

run().catch((error) => {
  console.error('[Phase12 Runner Error]', error);
  process.exitCode = 1;
});
