// backend/src/utils/appUrl.js
// Resolve public URLs from explicit configuration or the current request.
// Never fall back to a domain this deployment does not control.

const trimTrailingSlashes = (value) => String(value || '').trim().replace(/\/+$/, '');

const getAppBaseUrl = (req) => {
  const configured = trimTrailingSlashes(process.env.APP_URL || process.env.CLIENT_URL);
  if (configured) return configured;

  const origin = trimTrailingSlashes(req?.get?.('origin') || req?.headers?.origin);
  if (origin) return origin;

  const host = req?.get?.('host');
  if (host) return `${req.protocol || 'http'}://${host}`;

  return '';
};

const buildAppUrl = (req, path) => {
  const base = getAppBaseUrl(req);
  if (!base) return '';
  const suffix = String(path || '').startsWith('/') ? path : `/${path || ''}`;
  return `${base}${suffix}`;
};

const getMetaRedirectUri = () => {
  const explicit = trimTrailingSlashes(process.env.META_REDIRECT_URI);
  if (explicit) return explicit;

  const clientUrl = trimTrailingSlashes(process.env.CLIENT_URL || process.env.APP_URL);
  if (!clientUrl) {
    throw new Error('META_REDIRECT_URI or CLIENT_URL must be configured to use Meta OAuth');
  }
  return `${clientUrl}/api/meta/oauth/callback`;
};

module.exports = {
  getAppBaseUrl,
  buildAppUrl,
  getMetaRedirectUri,
};
