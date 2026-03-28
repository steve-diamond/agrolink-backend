const express = require('express');
const {
	listProducts,
	getProductById,
	createProduct,
	updateProduct,
	deleteProduct,
} = require('../controllers/productController');
// You may want to add your authMiddleware here
const router = express.Router();
router.get('/', listProducts);
router.get('/:id', getProductById);
router.post('/', createProduct); // Add authMiddleware for protection
router.put('/:id', updateProduct); // Add authMiddleware for protection
router.delete('/:id', deleteProduct); // Add authMiddleware for protection
module.exports = router;
