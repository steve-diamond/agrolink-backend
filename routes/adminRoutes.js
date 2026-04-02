const express = require('express');
const { getAllUsers, getAllProducts, approveProduct, approveUser, deleteUser, getAllOrders } = require('../controllers/adminController');

const router = express.Router();

// Get all users
router.get('/users', getAllUsers);

// Get all products
router.get('/products', getAllProducts);

// Approve a product
router.patch('/products/:productId/approve', approveProduct);

// Approve a user
router.patch('/users/:userId/approve', approveUser);

// Delete a user
router.delete('/users/:userId', deleteUser);

// Get all orders
router.get('/orders', getAllOrders);

module.exports = router;
