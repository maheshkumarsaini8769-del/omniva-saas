// backend/src/utils/productImages.js
// Product images are stored as objects with one URL per size variant:
//   { thumb, card, full, key, alt }
// Older products still store a plain URL string. These helpers accept both so
// a migration is never required for the storefront to keep working.

const DEFAULT_VARIANT = 'card';

const normalizeImage = (image) => {
  if (!image) return null;

  if (typeof image === 'string') {
    const url = image.trim();
    if (!url) return null;
    // Legacy URL: the same image is used for every size.
    return { thumb: url, card: url, full: url, key: '', alt: '', storageKeys: {} };
  }

  if (typeof image !== 'object') return null;

  const thumb = String(image.thumb || '').trim();
  const card = String(image.card || '').trim();
  const full = String(image.full || '').trim();
  const primary = full || card || thumb;
  if (!primary) return null;

  return {
    thumb: thumb || card || full,
    card: card || full || thumb,
    full: primary,
    key: String(image.key || '').trim(),
    alt: String(image.alt || '').trim(),
    storageKeys:
      image.storageKeys && typeof image.storageKeys === 'object' ? image.storageKeys : {},
  };
};

const normalizeProductImages = (images) => {
  if (!images) return [];
  const list = Array.isArray(images) ? images : [images];
  return list.map(normalizeImage).filter(Boolean);
};

/**
 * URL for one image variant.
 * @param {Array|Object} images - product images array or a single image
 * @param {String} variant - 'thumb' | 'card' | 'full'
 */
const getImageUrl = (images, variant = DEFAULT_VARIANT) => {
  const list = Array.isArray(images) ? images : images ? [images] : [];
  for (const raw of list) {
    const image = normalizeImage(raw);
    if (!image) continue;
    return image[variant] || image.full || image.card || image.thumb || '';
  }
  return '';
};

const getPrimaryImageUrl = (images, variant = DEFAULT_VARIANT) => getImageUrl(images, variant);

/**
 * Storage keys of a product's images, used to clean up objects when the
 * product is deleted.
 */
const getImageStorageKeys = (images) => {
  const keys = [];
  for (const image of normalizeProductImages(images)) {
    if (image.key) keys.push(image.key);
    if (image.storageKeys && typeof image.storageKeys === 'object') {
      for (const value of Object.values(image.storageKeys)) {
        if (value) keys.push(String(value));
      }
    }
  }
  return [...new Set(keys)];
};

module.exports = {
  DEFAULT_VARIANT,
  getImageStorageKeys,
  getImageUrl,
  getPrimaryImageUrl,
  normalizeImage,
  normalizeProductImages,
};
