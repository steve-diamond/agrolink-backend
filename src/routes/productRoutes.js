const express = require('express');
const { protect } = require('../middleware/auth.middleware');
const {
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/product.controller');
const { body, param, validate } = require('../../middleware/validation');

const router = express.Router();

router.get('/', listProducts);
router.get('/:id',
  param('id').isMongoId().withMessage('Invalid product ID'),
  validate,
  getProductById
);
router.post('/',
  protect,
  body('name').isString().trim().notEmpty(),
  body('description').isString().trim().notEmpty(),
  body('category').isString().trim().notEmpty(),
  body('price').isNumeric().toFloat().isFloat({ gt: 0 }),
  body('quantity').isInt({ min: 1 }),
  body('unit').optional().isString().trim(),
  validate,
  createProduct
);
router.patch('/:id',
  protect,
  param('id').isMongoId().withMessage('Invalid product ID'),
  body('name').optional().isString().trim(),
  body('description').optional().isString().trim(),
  body('category').optional().isString().trim(),
  body('price').optional().isNumeric().toFloat().isFloat({ gt: 0 }),
  body('quantity').optional().isInt({ min: 1 }),
  body('unit').optional().isString().trim(),
  body('isActive').optional().isBoolean(),
  validate,
  updateProduct
);
router.delete('/:id',
  protect,
  param('id').isMongoId().withMessage('Invalid product ID'),
  validate,
  deleteProduct
);

module.exports = router;
