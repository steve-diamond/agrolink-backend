const express = require('express');
const {
	createOrder,
	getUserOrders,
	getAllOrders,
	getOrderById,
	updateOrderStatus,
} = require('../controllers/orderController');
// You may want to add your authMiddleware here
const router = express.Router();
router.post('/', createOrder); // Add authMiddleware for protection
router.get('/my', getUserOrders); // Add authMiddleware for protection
router.get('/', getAllOrders); // Add authMiddleware for protection
router.get('/:id', getOrderById); // Add authMiddleware for protection
router.put('/:id/status', updateOrderStatus); // Add authMiddleware for protection
module.exports = router;
