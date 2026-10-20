const crypto = require('crypto');

// Meta matches phone hashes on E.164 digits (country code, no symbols).
// Normalize before hashing so "+91 98765 43210" and "919876543210" match.
const normalizePhone = (phone) => {
  if (!phone) return null;
  const digits = String(phone).replace(/\D/g, '');
  if (!digits) return null;
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 11 && digits.startsWith('0')) return `91${digits.slice(1)}`;
  return digits;
};

// Helper to hash user data (email, phone) using SHA-256 for Meta privacy compliance
const hashData = (str) => {
  if (!str) return null;
  return crypto
    .createHash('sha256')
    .update(str.trim().toLowerCase())
    .digest('hex');
};

/**
 * Dispatches a Server-Side Event to Meta Conversions API (CAPI)
 * @param {Object} params
 * @param {Object} params.tenant - Tenant document containing settings
 * @param {string} params.eventName - 'Lead', 'QualifiedLead', 'Purchase', 'AddToCart'
 * @param {string} params.eventId - Unique ID for browser & server deduplication
 * @param {string} params.eventSourceUrl - URL where the conversion occurred
 * @param {Object} params.userData - { email, phone, fbclid, fbp }
 * @param {Object} params.customData - { currency, value, contentName }
 */
const sendCapiEvent = async ({
  tenant,
  eventName,
  eventId,
  eventSourceUrl,
  userData = {},
  customData = {},
}) => {
  const pixelId = tenant?.settings?.metaPixelId;
  const capiToken = tenant?.settings?.metaCapiToken;

  const payload = {
    event_name: eventName,
    event_time: Math.floor(Date.now() / 1000),
    event_id: eventId || `ev_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    event_source_url: eventSourceUrl || undefined,
    action_source: 'website',
    user_data: {
      em: userData.email ? [hashData(userData.email)] : [],
      ph: userData.phone ? [hashData(normalizePhone(userData.phone))] : [],
      fbc: userData.fbclid ? `fb.1.${Date.now()}.${userData.fbclid}` : undefined,
    },
    custom_data: {
      currency: customData.currency || 'INR',
      value: customData.value || 0,
      content_name: customData.contentName || undefined,
    },
  };

  // Missing or placeholder credentials must fail closed. A simulated event must
  // never be reported to the merchant as a successful Meta delivery.
  if (!pixelId || !capiToken || capiToken.startsWith('mock_')) {
    return {
      success: false,
      mode: 'NOT_CONFIGURED',
      message: 'Meta CAPI is not configured. Add a real Pixel ID and access token before testing.',
      eventId: payload.event_id,
    };
  }

  // Real Meta Graph API dispatch
  try {
    const url = `https://graph.facebook.com/v21.0/${pixelId}/events?access_token=${capiToken}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: [payload] }),
    });
    const resData = await res.json();
    return {
      success: res.ok,
      mode: 'LIVE_META_DISPATCH',
      eventId: payload.event_id,
      fbTraceId: resData?.fbtrace_id,
      eventsReceived: resData?.events_received,
    };
  } catch (error) {
    console.error('[Meta CAPI Error]', error.response?.data || error.message);
    return {
      success: false,
      mode: 'ERROR',
      message: error.response?.data?.error?.message || error.message,
      eventId: payload.event_id,
    };
  }
};

module.exports = {
  hashData,
  normalizePhone,
  sendCapiEvent,
};
