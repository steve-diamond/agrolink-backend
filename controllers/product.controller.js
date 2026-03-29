const asyncHandler = require('../utils/asyncHandler');
const {
  listProductsService,
  getProductByIdService,
  createProductService,
  updateProductService,
  deleteProductService,
} = require('../../services/productService');

const listProducts = asyncHandler(async (req, res) => {
  const data = await listProductsService(req.query);
  res.status(200).json({ status: 'success', data });
});

const getProductById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const product = await getProductByIdService(id);
  res.status(200).json({ status: 'success', data: { product } });
});

const createProduct = asyncHandler(async (req, res) => {
  const { name, description, category, price, quantity, unit } = req.body;
  const product = await createProductService({
    name,
    description,
    category,
    price,
    quantity,
    unit,
    farmerId: req.user._id,
  });
  res.status(201).json({ status: 'success', data: { product } });
});

const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const product = await updateProductService(id, req.body, req.user._id);
  res.status(200).json({ status: 'success', data: { product } });
});

const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await deleteProductService(id, req.user._id);
  res.status(200).json({ status: 'success', message: 'Product deleted successfully.' });
});

module.exports = {
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
