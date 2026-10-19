// backend/src/utils/sharedOrderStore.js
// Shared in-memory order registry for real-time order visibility across serverless requests and demo fallback

const INITIAL_DEMO_ORDERS = [
  {
    _id: 'ord_demo_1088',
    orderNumber: 'ORD-1088',
    businessId: '6acf096038d323550330be64',
    customerName: 'Vikram Rathore',
    customerPhone: '+91 98290 12345',
    customerEmail: 'vikram.rathore@example.com',
    shippingAddress: {
      street: 'Plot 42, Civil Lines',
      city: 'Jaipur',
      state: 'Rajasthan',
      pincode: '302006'
    },
    items: [
      {
        productId: 'prod_mango_1',
        name: 'Traditional Rajasthani Mango Pickle 500g',
        variantName: '500g Glass Jar',
        quantity: 1,
        price: 299,
        subtotal: 299,
        image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=300&auto=format&fit=crop&q=80'
      },
      {
        productId: 'prod_chilli_1',
        name: 'Spicy Green Chilli Pickle 250g',
        variantName: '250g Pouch',
        quantity: 1,
        price: 189,
        subtotal: 189,
        image: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=300&auto=format&fit=crop&q=80'
      }
    ],
    subtotal: 488,
    shippingFee: 0,
    discount: 0,
    couponCode: '',
    totalAmount: 488,
    paymentMethod: 'COD',
    paymentStatus: 'PENDING',
    orderStatus: 'NEW',
    attribution: {
      utmSource: 'INSTAGRAM',
      utmMedium: 'cpc',
      utmCampaign: 'Reel Launch - Rajasthani Achar Promo'
    },
    timeline: [
      { status: 'NEW', note: 'Order placed by customer via Instagram Ad', timestamp: new Date(Date.now() - 35 * 60 * 1000) }
    ],
    createdAt: new Date(Date.now() - 35 * 60 * 1000)
  },
  {
    _id: 'ord_demo_1087',
    orderNumber: 'ORD-1087',
    businessId: '6acf096038d323550330be64',
    customerName: 'Priya Sundaram',
    customerPhone: '+91 98450 67890',
    customerEmail: 'priya.sundaram@example.com',
    shippingAddress: {
      street: 'Flat 4B, Palm Grove Heights, Indiranagar',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560038'
    },
    items: [
      {
        productId: 'prod_lemon_1',
        name: 'Khatta Meetha Lime (Nimbu) Pickle 500g',
        variantName: '500g Traditional Jar',
        quantity: 2,
        price: 269,
        subtotal: 538,
        image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=300&auto=format&fit=crop&q=80'
      }
    ],
    subtotal: 538,
    shippingFee: 0,
    discount: 50,
    couponCode: 'WELCOME10',
    totalAmount: 488,
    paymentMethod: 'ONLINE',
    paymentStatus: 'PAID',
    orderStatus: 'CONFIRMED',
    attribution: {
      utmSource: 'WEBSITE',
      utmMedium: 'organic',
      utmCampaign: 'Storefront Direct Order'
    },
    timeline: [
      { status: 'NEW', note: 'Order placed online', timestamp: new Date(Date.now() - 2 * 3600 * 1000) },
      { status: 'CONFIRMED', note: 'Order accepted by merchant', timestamp: new Date(Date.now() - 100 * 60 * 1000) }
    ],
    createdAt: new Date(Date.now() - 2 * 3600 * 1000)
  },
  {
    _id: 'ord_demo_1086',
    orderNumber: 'ORD-1086',
    businessId: '6acf096038d323550330be64',
    customerName: 'Aarav Mehta',
    customerPhone: '+91 99887 76655',
    customerEmail: 'aarav.mehta@example.com',
    shippingAddress: {
      street: '15, Ridge Road, Malabar Hill',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400006'
    },
    items: [
      {
        productId: 'prod_garlic_1',
        name: 'Spicy Crushed Lahsun Garlic Pickle 500g',
        variantName: '500g Glass Jar',
        quantity: 1,
        price: 319,
        subtotal: 319,
        image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&auto=format&fit=crop&q=80'
      }
    ],
    subtotal: 319,
    shippingFee: 50,
    discount: 0,
    couponCode: '',
    totalAmount: 369,
    paymentMethod: 'COD',
    paymentStatus: 'PENDING',
    orderStatus: 'SHIPPED',
    courierPartner: 'BlueDart Express',
    trackingNumber: 'BLUEDART-88992211',
    attribution: {
      utmSource: 'FACEBOOK',
      utmMedium: 'cpc',
      utmCampaign: 'Heritage Pickle Combo Ad'
    },
    timeline: [
      { status: 'NEW', note: 'Order placed online', timestamp: new Date(Date.now() - 6 * 3600 * 1000) },
      { status: 'CONFIRMED', note: 'Order confirmed', timestamp: new Date(Date.now() - 5 * 3600 * 1000) },
      { status: 'SHIPPED', note: 'Dispatched via BlueDart Express', timestamp: new Date(Date.now() - 3 * 3600 * 1000) }
    ],
    createdAt: new Date(Date.now() - 6 * 3600 * 1000)
  }
];

// Global in-memory orders store
global._omnivaOrders = global._omnivaOrders || [...INITIAL_DEMO_ORDERS];

const getStoredOrders = () => {
  return global._omnivaOrders;
};

const addStoredOrder = (order) => {
  if (!order) return;
  const exists = global._omnivaOrders.some(o => o.orderNumber === order.orderNumber);
  if (!exists) {
    global._omnivaOrders.unshift(order);
  }
  return order;
};

const updateStoredOrderStatus = (orderId, newStatus, updater = 'Merchant') => {
  const ord = global._omnivaOrders.find(o => o._id === orderId || o.orderNumber === orderId);
  if (ord) {
    ord.orderStatus = newStatus;
    if (newStatus === 'DELIVERED') {
      ord.paymentStatus = 'PAID';
    }
    ord.timeline = ord.timeline || [];
    ord.timeline.push({
      status: newStatus,
      note: `Status updated to ${newStatus} by ${updater}`,
      timestamp: new Date()
    });
    return ord;
  }
  return null;
};

module.exports = {
  INITIAL_DEMO_ORDERS,
  getStoredOrders,
  addStoredOrder,
  updateStoredOrderStatus
};
