const express = require('express');
const {
  createOrder,
  getUserOrders,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
} = require('../controllers/order.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const { body, param, validate } = require('../../middleware/validation');

const router = express.Router();

router.use(protect);

router.post('/',
  authorize('buyer'),
  body('items').optional().isArray(),
  body('products').optional().isArray(),
  body('productId').optional().isMongoId(),
  body('quantity').optional().isInt({ min: 1 }),
  validate,
  createOrder
);
router.get('/', getUserOrders);
router.get('/all', authorize('admin'), getAllOrders);
router.get('/:id',
  param('id').isMongoId().withMessage('Invalid order ID'),
  validate,
  getOrderById
);
router.patch('/:id/status',
  authorize('farmer'),
  param('id').isMongoId().withMessage('Invalid order ID'),
  body('status').isString().trim().isIn(['pending', 'paid', 'delivered']),
  validate,
  updateOrderStatus
);

module.exports = router;
