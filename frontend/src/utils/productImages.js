// frontend/src/utils/productImages.js
// Product images are stored as { thumb, card, full }. Legacy products still
// hold a plain URL string, so every helper accepts both shapes.

export const IMAGE_VARIANTS = ['thumb', 'card', 'full'];

const readImage = (raw) => {
  if (!raw) return null;
  if (typeof raw === 'string') {
    const url = raw.trim();
    return url ? { thumb: url, card: url, full: url, key: '', alt: '' } : null;
  }
  if (typeof raw !== 'object') return null;

  const thumb = (raw.thumb || '').trim();
  const card = (raw.card || '').trim();
  const full = (raw.full || '').trim();
  const primary = full || card || thumb;
  if (!primary) return null;

  return {
    thumb: thumb || card || full,
    card: card || full || thumb,
    full: primary,
    key: raw.key || '',
    alt: raw.alt || '',
    storageKeys: raw.storageKeys || {},
  };
};

/**
 * URL for one image variant. Falls back to the other sizes when the requested
 * one is missing.
 */
export const getImageUrl = (images, variant = 'card') => {
  const list = Array.isArray(images) ? images : images ? [images] : [];
  for (const raw of list) {
    const image = readImage(raw);
    if (!image) continue;
    if (variant === 'thumb') return image.thumb || image.card || image.full;
    if (variant === 'full') return image.full || image.card || image.thumb;
    return image.card || image.full || image.thumb;
  }
  return '';
};

export const getPrimaryImageUrl = (images) => getImageUrl(images, 'card');

/**
 * Responsive srcset built from the three stored sizes. The browser then picks
 * the smallest image that fits the rendered size, which keeps mobile pages
 * light on slow networks.
 */
export const getImageSrcSet = (images) => {
  const list = Array.isArray(images) ? images : images ? [images] : [];
  for (const raw of list) {
    const image = readImage(raw);
    if (!image) continue;
    const parts = [];
    if (image.thumb) parts.push(`${image.thumb} 200w`);
    if (image.card) parts.push(`${image.card} 600w`);
    if (image.full) parts.push(`${image.full} 1200w`);
    return parts.join(', ');
  }
  return '';
};

/**
 * Build a product image entry from an upload API response.
 */
export const buildImageEntry = (upload) => {
  if (!upload) return null;
  const thumb = upload.thumb?.url || '';
  const card = upload.card?.url || '';
  const full = upload.full?.url || '';
  if (!thumb && !card && !full) return null;
  return {
    thumb,
    card,
    full,
    key: upload.full?.key || upload.card?.key || '',
    alt: '',
    storageKeys: {
      thumb: upload.thumb?.key || '',
      card: upload.card?.key || '',
      full: upload.full?.key || '',
      original: upload.original?.key || '',
    },
  };
};

/**
 * Build a product image entry from a plain URL (fallback for merchants who
 * paste an image link instead of uploading).
 */
export const buildImageEntryFromUrl = (url) => {
  const clean = String(url || '').trim();
  if (!clean) return null;
  return { thumb: clean, card: clean, full: clean, key: '', alt: '', storageKeys: {} };
};
