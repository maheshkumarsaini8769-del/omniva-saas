// backend/src/config/whatsappTemplates.js
// Canonical catalogue of the business-initiated WhatsApp templates Omniva
// supports. A merchant must create and get these templates APPROVED in their
// own Meta WhatsApp Business Account before Omniva can send them.
//
// The body variable order below is the contract: it must match the order of
// the placeholders ({{1}}, {{2}}, ...) in the approved Meta template, otherwise
// Meta rejects the message. Omniva always sends the same number of body
// parameters, in the same order, so values can never shift between slots.

const WHATSAPP_TEMPLATES = {
  order_confirmation: {
    key: 'order_confirmation',
    label: 'Order Confirmation',
    description: 'Sent right after a COD order is placed.',
    bodyVariables: ['customerName', 'orderNumber', 'totalAmount', 'trackingUrl'],
    requiredVariables: ['customerName', 'orderNumber'],
  },
  order_shipped: {
    key: 'order_shipped',
    label: 'Order Shipped',
    description: 'Sent when the courier hands over the parcel.',
    bodyVariables: ['customerName', 'orderNumber', 'courierName', 'trackingNumber'],
    requiredVariables: ['customerName', 'orderNumber'],
  },
  order_delivered: {
    key: 'order_delivered',
    label: 'Order Delivered',
    description: 'Sent on delivery with a feedback link.',
    bodyVariables: ['customerName', 'orderNumber', 'feedbackUrl'],
    requiredVariables: ['customerName', 'orderNumber'],
  },
  order_cancelled: {
    key: 'order_cancelled',
    label: 'Order Cancelled',
    description: 'Sent when an order is cancelled or auto-cancelled.',
    bodyVariables: ['customerName', 'orderNumber', 'refundInfo'],
    requiredVariables: ['customerName', 'orderNumber'],
  },
  cod_verification: {
    key: 'cod_verification',
    label: 'COD Verification',
    description: 'Asks the customer to confirm a COD order. Uses Yes/No quick reply buttons defined in the approved template.',
    bodyVariables: ['customerName', 'orderNumber', 'totalAmount'],
    requiredVariables: ['customerName', 'orderNumber', 'totalAmount'],
    hasButtons: true,
  },
  cart_recovery: {
    key: 'cart_recovery',
    label: 'Cart Recovery',
    description: 'Sent when a customer leaves an abandoned cart.',
    bodyVariables: ['customerName', 'productName', 'checkoutUrl'],
    requiredVariables: ['customerName', 'productName'],
  },
};

// Accepted aliases so a rule may use a differently named data key without
// shifting the approved template's variable order.
const VARIABLE_ALIASES = {
  customerName: ['customerName', 'name'],
  orderNumber: ['orderNumber', 'orderId'],
  totalAmount: ['totalAmount', 'amount', 'orderAmount'],
  trackingUrl: ['trackingUrl', 'trackingLink', 'trackUrl'],
  courierName: ['courierName', 'courierPartner', 'courier'],
  trackingNumber: ['trackingNumber', 'awb', 'awbNumber'],
  feedbackUrl: ['feedbackUrl', 'reviewUrl', 'storeUrl'],
  refundInfo: ['refundInfo', 'refundStatus', 'refundMessage'],
  productName: ['productName', 'itemName'],
  checkoutUrl: ['checkoutUrl', 'cartUrl', 'storeUrl'],
};

const WHATSAPP_TEMPLATE_KEYS = Object.keys(WHATSAPP_TEMPLATES);

const getTemplateDefinition = (key) => {
  if (!key) return null;
  return WHATSAPP_TEMPLATES[String(key).trim()] || null;
};

// Pull a value for a template variable from the automation payload.
const pickVariableValue = (data, key) => {
  const aliases = VARIABLE_ALIASES[key] || [key];
  for (const alias of aliases) {
    const value = data ? data[alias] : undefined;
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return String(value);
    }
  }
  return '';
};

module.exports = {
  VARIABLE_ALIASES,
  WHATSAPP_TEMPLATES,
  WHATSAPP_TEMPLATE_KEYS,
  getTemplateDefinition,
  pickVariableValue,
};
