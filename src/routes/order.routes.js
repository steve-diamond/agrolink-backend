const express = require('express');

const {
  createOrder,
  getMyOrders,
  getOrderById,
  updateOrderStatus,
} = require('../controllers/order.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(protect);

router.post('/', authorize('buyer'), createOrder);
router.get('/', getMyOrders);
router.get('/:id', getOrderById);
router.patch('/:id/status', authorize('farmer'), updateOrderStatus);

module.exports = router;
