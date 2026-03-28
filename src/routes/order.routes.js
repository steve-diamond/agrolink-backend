const express = require('express');

const {
  createOrder,
  getUserOrders,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
} = require('../controllers/order.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(protect);

router.post('/', authorize('buyer'), createOrder);
router.get('/', getUserOrders);
router.get('/all', authorize('admin'), getAllOrders);
router.get('/:id', getOrderById);
router.patch('/:id/status', authorize('farmer'), updateOrderStatus);

module.exports = router;
