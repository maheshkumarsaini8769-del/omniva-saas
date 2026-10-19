const express = require('express');
const router = express.Router();
const { protect, authorize, tenantScope } = require('../middlewares/authMiddleware');
const moduleGate = require('../middlewares/moduleGate');
const {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  applyBulkDiscount,
} = require('../controllers/productController');

const allowedMerchantRoles = [
  'SUPER_ADMIN',
  'SUPER_STAFF',
  'MERCHANT_OWNER',
  'ORDER_MANAGER',
  'INVENTORY_STAFF',
  'MARKETING_STAFF',
  'SUPPORT_STAFF',
];

const managerRoles = [
  'SUPER_ADMIN',
  'SUPER_STAFF',
  'MERCHANT_OWNER',
  'INVENTORY_STAFF',
];

// Categories
router.route('/categories')
  .get(protect, authorize(...allowedMerchantRoles), tenantScope, moduleGate('products'), getCategories)
  .post(protect, authorize(...managerRoles), tenantScope, moduleGate('products'), createCategory);

router.route('/categories/:id')
  .put(protect, authorize(...managerRoles), tenantScope, moduleGate('products'), updateCategory)
  .delete(protect, authorize(...managerRoles), tenantScope, moduleGate('products'), deleteCategory);

// Bulk Discount
router.route('/products/bulk-discount')
  .post(protect, authorize(...managerRoles), tenantScope, moduleGate('products'), applyBulkDiscount);

// Products
router.route('/products')
  .get(protect, authorize(...allowedMerchantRoles), tenantScope, moduleGate('products'), getProducts)
  .post(protect, authorize(...managerRoles), tenantScope, moduleGate('products'), createProduct);

router.route('/products/:id')
  .get(protect, authorize(...allowedMerchantRoles), tenantScope, moduleGate('products'), getProductById)
  .put(protect, authorize(...managerRoles), tenantScope, moduleGate('products'), updateProduct)
  .delete(protect, authorize(...managerRoles), tenantScope, moduleGate('products'), deleteProduct);

module.exports = router;
