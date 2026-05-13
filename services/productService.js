const Product = require('../models/Product');

/**
 * List products with optional filtering, pagination, and sorting.
 */
const listProductsService = async (query = {}) => {
  const { page = 1, limit = 20, category, location, search } = query;
  const skip = (Number(page) - 1) * Number(limit);

  const filter = { isActive: true };
  if (category) filter.category = category;
  if (location) filter.location = new RegExp(location, 'i');
  if (search) filter.name = new RegExp(search, 'i');

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate('farmer', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Product.countDocuments(filter),
  ]);

  return { products, total, page: Number(page), limit: Number(limit) };
};

/**
 * Get a single product by ID.
 */
const getProductByIdService = async (id) => {
  const product = await Product.findById(id).populate('farmer', 'name email').lean();
  if (!product) {
    const err = new Error('Product not found');
    err.statusCode = 404;
    throw err;
  }
  return product;
};

/**
 * Create a new product listing.
 */
const createProductService = async ({ name, description, category, location, imageUrl, price, quantity, unit, farmerId }) => {
  const product = await Product.create({
    name,
    description,
    category,
    location,
    imageUrl,
    price,
    quantity,
    unit,
    farmer: farmerId,
  });
  return product;
};

/**
 * Update a product (only by the owning farmer).
 */
const updateProductService = async (id, updates, farmerId) => {
  const product = await Product.findOneAndUpdate(
    { _id: id, farmer: farmerId },
    { $set: updates },
    { new: true, runValidators: true }
  );
  if (!product) {
    const err = new Error('Product not found or not authorised');
    err.statusCode = 404;
    throw err;
  }
  return product;
};

/**
 * Delete a product (only by the owning farmer).
 */
const deleteProductService = async (id, farmerId) => {
  const product = await Product.findOneAndDelete({ _id: id, farmer: farmerId });
  if (!product) {
    const err = new Error('Product not found or not authorised');
    err.statusCode = 404;
    throw err;
  }
  return product;
};

module.exports = {
  listProductsService,
  getProductByIdService,
  createProductService,
  updateProductService,
  deleteProductService,
};
