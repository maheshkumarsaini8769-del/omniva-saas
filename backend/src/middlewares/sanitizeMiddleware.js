/**
 * Middleware to sanitize user input against NoSQL ($gt, $ne, $where) injection attacks
 */
const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  const cleaned = {};
  for (const [key, val] of Object.entries(obj)) {
    // Strip keys with leading $ or containing . (allow Meta webhook hub.* query parameters)
    if (key.startsWith('$') || (key.includes('.') && !key.startsWith('hub.'))) {
      continue;
    }
    if (typeof val === 'object' && val !== null) {
      cleaned[key] = sanitizeObject(val);
    } else if (typeof val === 'string') {
      // Strip dangerous script tags to prevent stored XSS attacks
      cleaned[key] = val.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '').trim();
    } else {
      cleaned[key] = val;
    }
  }
  return cleaned;
};

const sanitizeInput = (req, res, next) => {
  if (req.body) req.body = sanitizeObject(req.body);
  if (req.query) req.query = sanitizeObject(req.query);
  if (req.params) req.params = sanitizeObject(req.params);
  next();
};

module.exports = {
  sanitizeInput,
  sanitizeObject,
};
