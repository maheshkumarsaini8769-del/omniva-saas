// Central role policy for tenant-facing routes. Keeping these lists in one
// place prevents one route from accidentally becoming the weak link as new
// endpoints are added.
const ALL_MERCHANT_ROLES = [
  'SUPER_ADMIN',
  'SUPER_STAFF',
  'MERCHANT_OWNER',
  'ORDER_MANAGER',
  'INVENTORY_STAFF',
  'MARKETING_STAFF',
  'SUPPORT_STAFF',
];

const OWNER_ROLES = [
  'SUPER_ADMIN',
  'SUPER_STAFF',
  'MERCHANT_OWNER',
];

// Roles that may create/update products and inventory.
const INVENTORY_WRITE_ROLES = [
  ...OWNER_ROLES,
  'INVENTORY_STAFF',
];

// Roles that process customer orders and leads.
const ORDER_WRITE_ROLES = [
  ...OWNER_ROLES,
  'ORDER_MANAGER',
  'INVENTORY_STAFF',
];

// Customer-facing CRM work. Inventory staff have no reason to read customer
// phone numbers or sales pipeline data.
const CRM_ROLES = [
  ...OWNER_ROLES,
  'ORDER_MANAGER',
  'MARKETING_STAFF',
  'SUPPORT_STAFF',
];

// Marketing owns campaign messaging and automation rules.
const MARKETING_ROLES = [
  ...OWNER_ROLES,
  'MARKETING_STAFF',
];

// Revenue and performance reports. Support and inventory staff only need order
// execution data, not company-wide revenue.
const ANALYTICS_ROLES = [
  ...OWNER_ROLES,
  'ORDER_MANAGER',
  'MARKETING_STAFF',
];

const SUBSCRIPTION_ROLES = [
  ...OWNER_ROLES,
  'ORDER_MANAGER',
  'INVENTORY_STAFF',
  'MARKETING_STAFF',
];

module.exports = {
  ALL_MERCHANT_ROLES,
  OWNER_ROLES,
  INVENTORY_WRITE_ROLES,
  ORDER_WRITE_ROLES,
  CRM_ROLES,
  MARKETING_ROLES,
  ANALYTICS_ROLES,
  SUBSCRIPTION_ROLES,
};
