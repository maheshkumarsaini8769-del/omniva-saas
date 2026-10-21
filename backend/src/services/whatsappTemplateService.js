// backend/src/services/whatsappTemplateService.js
// Sends approved WhatsApp templates through the Meta Cloud API.
//
// Rules that apply to every call in this file:
// - The tenant's own WhatsApp Business credentials are used. There is no
//   platform-level fallback number or token.
// - Every outbound call has a hard timeout and retries transient failures
//   with exponential backoff.
// - 4xx responses are never retried: a rejected template will not become
//   valid by sending it again.
// - The Meta message id is returned so a reply can be matched back to the
//   order (needed for COD verification button replies).

const Tenant = require('../models/Tenant');

const DEFAULT_API_VERSION = 'v21.0';
const DEFAULT_GRAPH_BASE_URL = 'https://graph.facebook.com';
const DEFAULT_TIMEOUT_MS = 10000;
const MAX_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 400;

class WhatsAppTemplateError extends Error {
  constructor(message, { statusCode = 0, retryable = false, code = 'WHATSAPP_ERROR' } = {}) {
    super(message);
    this.name = 'WhatsAppTemplateError';
    this.statusCode = statusCode;
    this.retryable = retryable;
    this.code = code;
  }
}

const trimTrailingSlashes = (value) => String(value || '').trim().replace(/\/+$/, '');

const getGraphBaseUrl = () =>
  trimTrailingSlashes(process.env.META_GRAPH_API_BASE_URL || DEFAULT_GRAPH_BASE_URL);

const getGraphApiVersion = () =>
  String(process.env.META_GRAPH_API_VERSION || DEFAULT_API_VERSION).trim() || DEFAULT_API_VERSION;

const getRequestTimeoutMs = () => {
  const configured = Number(process.env.META_GRAPH_TIMEOUT_MS);
  return Number.isFinite(configured) && configured > 0 ? configured : DEFAULT_TIMEOUT_MS;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Normalize a customer phone number to the format Meta expects (digits only).
 * Indian numbers are sent as 91XXXXXXXXXX. Anything else is rejected instead
 * of being silently mangled into a wrong number.
 */
const normalizeWhatsAppPhone = (rawPhone) => {
  const digits = String(rawPhone || '').replace(/\D/g, '');
  if (!digits) {
    return { phone: '', error: 'Customer phone number is missing' };
  }
  if (digits.length === 10) {
    return { phone: `91${digits}`, error: '' };
  }
  if (digits.length === 12 && digits.startsWith('91')) {
    return { phone: digits, error: '' };
  }
  if (digits.length === 11 && digits.startsWith('0')) {
    return { phone: `91${digits.slice(1)}`, error: '' };
  }
  return {
    phone: '',
    error: `Customer phone number is not a valid 10-digit mobile number (received ${digits.length} digits)`,
  };
};

/**
 * Read the tenant's WhatsApp Business credentials. The access token is stored
 * encrypted at rest and is decrypted by the Tenant schema getter.
 */
const resolveWhatsAppCredentials = (tenant) => {
  const whatsapp = tenant?.integrations?.whatsapp || {};
  return {
    accessToken: whatsapp.accessToken || '',
    phoneNumberId: whatsapp.phoneNumberId || '',
    senderPhone: whatsapp.senderPhone || '',
  };
};

/**
 * Normalize the per-tenant template mapping. Both shapes are accepted:
 *   { order_confirmation: 'order_conf_v2' }
 *   { order_confirmation: { name: 'order_conf_v2', language: 'hi' } }
 */
const normalizeTemplateMapping = (rawMapping) => {
  const mapping = {};
  if (!rawMapping || typeof rawMapping !== 'object' || Array.isArray(rawMapping)) {
    return mapping;
  }
  for (const [key, value] of Object.entries(rawMapping)) {
    if (!value) continue;
    if (typeof value === 'string') {
      const name = value.trim();
      if (name) mapping[key] = { name, language: '' };
      continue;
    }
    if (typeof value === 'object') {
      const name = String(value.name || value.templateName || '').trim();
      if (!name) continue;
      const language = String(value.language || value.templateLanguage || '').trim();
      mapping[key] = { name, language };
    }
  }
  return mapping;
};

/**
 * Build the Meta template components. The body parameter count always matches
 * the approved template, even when a value is empty, so values can never
 * shift into the wrong slot.
 */
const buildTemplateComponents = ({ bodyParameters = [], buttonParameters = [] } = {}) => {
  const components = [];

  if (Array.isArray(bodyParameters) && bodyParameters.length > 0) {
    components.push({
      type: 'body',
      parameters: bodyParameters.map((value) => ({ type: 'text', text: String(value ?? '') })),
    });
  }

  if (Array.isArray(buttonParameters) && buttonParameters.length > 0) {
    components.push({
      type: 'button',
      sub_type: 'url',
      index: '0',
      parameters: buttonParameters.map((value) => ({ type: 'text', text: String(value ?? '') })),
    });
  }

  return components;
};

const buildMessagesUrl = (phoneNumberId, baseUrl = getGraphBaseUrl(), apiVersion = getGraphApiVersion()) =>
  `${baseUrl}/${apiVersion}/${phoneNumberId}/messages`;

/**
 * Send an approved WhatsApp template.
 *
 * @param {Object} params
 * @param {String} params.businessId - Tenant that owns the WhatsApp account
 * @param {String} params.to - Customer phone number (any format)
 * @param {String} params.templateName - Approved Meta template name
 * @param {String} [params.language='en'] - Approved template language code
 * @param {String[]} [params.bodyParameters] - Ordered body values
 * @param {String[]} [params.buttonParameters] - Ordered dynamic button values
 * @param {Object} [params.tenant] - Preloaded tenant document (optional)
 * @param {String} [params.accessToken] - Credential override (tests only)
 * @param {String} [params.phoneNumberId] - Credential override (tests only)
 * @param {String} [params.baseUrl] - Graph base URL override (tests only)
 * @returns {Promise<Object>} { success, messageId, contact, attempts }
 */
const sendTemplate = async ({
  businessId,
  to,
  templateName,
  language = 'en',
  bodyParameters = [],
  buttonParameters = [],
  components = null,
  tenant = null,
  accessToken: accessTokenOverride,
  phoneNumberId: phoneNumberIdOverride,
  baseUrl: baseUrlOverride,
  apiVersion: apiVersionOverride,
} = {}) => {
  const name = String(templateName || '').trim();
  if (!name) {
    throw new WhatsAppTemplateError('A WhatsApp template name is required', {
      code: 'TEMPLATE_NAME_MISSING',
    });
  }

  const { phone, error: phoneError } = normalizeWhatsAppPhone(to);
  if (!phone) {
    throw new WhatsAppTemplateError(phoneError, { code: 'INVALID_RECIPIENT' });
  }

  let resolvedTenant = tenant;
  if (!resolvedTenant && businessId) {
    resolvedTenant = await Tenant.findById(businessId).select(
      'integrations.whatsapp settings.waTemplates settings.waDefaultLanguage'
    );
  }
  if (!resolvedTenant) {
    throw new WhatsAppTemplateError('WhatsApp tenant configuration was not found', {
      code: 'NOT_CONFIGURED',
    });
  }

  const credentials = resolveWhatsAppCredentials(resolvedTenant);
  const accessToken = accessTokenOverride || credentials.accessToken;
  const phoneNumberId = phoneNumberIdOverride || credentials.phoneNumberId;

  if (!accessToken || !phoneNumberId) {
    throw new WhatsAppTemplateError(
      'Merchant has not configured WhatsApp Business API credentials',
      { code: 'NOT_CONFIGURED' }
    );
  }

  const templateLanguage =
    String(language || resolvedTenant?.settings?.waDefaultLanguage || 'en').trim() || 'en';

  const templateComponents =
    components ||
    buildTemplateComponents({ bodyParameters, buttonParameters });

  const payload = {
    messaging_product: 'whatsapp',
    to: phone,
    type: 'template',
    template: {
      name,
      language: { code: templateLanguage },
      ...(templateComponents.length > 0 ? { components: templateComponents } : {}),
    },
  };

  const url = buildMessagesUrl(
    phoneNumberId,
    baseUrlOverride || getGraphBaseUrl(),
    apiVersionOverride || getGraphApiVersion()
  );

  const timeoutMs = getRequestTimeoutMs();
  let lastError = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      const rawBody = await response.text().catch(() => '');

      if (!response.ok) {
        const retryable = response.status === 429 || response.status >= 500;
        const error = new WhatsAppTemplateError(
          `WhatsApp Cloud API returned HTTP ${response.status}${rawBody ? `: ${rawBody.slice(0, 200)}` : ''}`,
          { statusCode: response.status, retryable, code: 'META_HTTP_ERROR' }
        );
        if (!retryable) throw error;
        lastError = error;
      } else {
        let parsed = {};
        try {
          parsed = rawBody ? JSON.parse(rawBody) : {};
        } catch {
          parsed = {};
        }
        return {
          success: true,
          messageId: parsed?.messages?.[0]?.id || '',
          contact: parsed?.contacts?.[0]?.wa_id || phone,
          attempts: attempt,
          templateName: name,
          language: templateLanguage,
        };
      }
    } catch (error) {
      if (error instanceof WhatsAppTemplateError && !error.retryable) throw error;
      lastError =
        error instanceof WhatsAppTemplateError
          ? error
          : new WhatsAppTemplateError(
              error?.name === 'AbortError'
                ? `WhatsApp Cloud API request timed out after ${timeoutMs}ms`
                : `WhatsApp Cloud API request failed: ${error?.message || 'unknown error'}`,
              { retryable: true, code: 'NETWORK_ERROR' }
            );
    } finally {
      clearTimeout(timeoutId);
    }

    if (attempt < MAX_ATTEMPTS) {
      await sleep(RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1));
    }
  }

  throw lastError || new WhatsAppTemplateError('WhatsApp template delivery failed', { code: 'DELIVERY_FAILED' });
};

module.exports = {
  MAX_ATTEMPTS,
  WhatsAppTemplateError,
  buildTemplateComponents,
  buildMessagesUrl,
  normalizeTemplateMapping,
  normalizeWhatsAppPhone,
  resolveWhatsAppCredentials,
  sendTemplate,
};
