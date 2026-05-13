const express = require('express');

const { protect, authorize } = require('../middleware/auth.middleware');
const {
	getAllUsers,
	getAllProducts,
	approveProduct,
	approveUser,
	getFarmerApplications,
	approveFarmerApplication,
	getBuyerApplications,
	approveBuyerApplication,
	deleteUser,
	getAllOrders,
} = require('../controllers/adminController');

const router = express.Router();

// All admin routes require authentication and admin role
router.use(protect, authorize('admin'));

// Get all users
router.get('/users', getAllUsers);

// Get all products
router.get('/products', getAllProducts);

// Approve a product
router.patch('/products/:productId/approve', approveProduct);

// Approve a user
router.patch('/users/:userId/approve', approveUser);

// Farmer applications
router.get('/farmer-applications', getFarmerApplications);
router.patch('/farmer-applications/:applicationId/approve', approveFarmerApplication);

// Buyer applications
router.get('/buyer-applications', getBuyerApplications);
router.patch('/buyer-applications/:applicationId/approve', approveBuyerApplication);

// Delete a user
router.delete('/users/:userId', deleteUser);

// Get all orders
router.get('/orders', getAllOrders);

module.exports = router;
