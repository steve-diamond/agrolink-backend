const express = require('express');

const {
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/product.controller');
const { protect, authorize } = require('../middleware/auth.middleware');


const ensureActiveSubscription = require('../middleware/subscriptionMiddleware');

const router = express.Router();

router.get('/', listProducts);
router.get('/:id', getProductById);

router.post('/', protect, authorize('farmer'), ensureActiveSubscription, createProduct);
router.put('/:id', protect, authorize('farmer'), updateProduct);
router.delete('/:id', protect, authorize('farmer'), deleteProduct);

module.exports = router;
