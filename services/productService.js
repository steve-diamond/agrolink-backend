const mongoose = require('mongoose');
const Product = require('../models/Product');
const ApiError = require('./utils/apiError');

async function listProductsService({ page = 1, limit = 20, category, search, minPrice, maxPrice, sort = '-createdAt' }) {
  const pageNumber = Math.max(Number(page), 1);
  const limitNumber = Math.min(Math.max(Number(limit), 1), 100);
  const filter = { isActive: true };
  if (category) filter.category = category;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }
  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate('farmer', 'name email role')
      .sort(sort)
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber),
    Product.countDocuments(filter),
  ]);
  return {
    items: products,
    pagination: {
      page: pageNumber,
      limit: limitNumber,
      total,
      totalPages: Math.ceil(total / limitNumber) || 1,
    },
  };
}

async function getProductByIdService(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, 'Invalid product ID.');
  }
  const product = await Product.findOne({ _id: id, isActive: true }).populate('farmer', 'name email role');
  if (!product) throw new ApiError(404, 'Product not found.');
  return product;
}

async function createProductService({ name, description, category, price, quantity, unit, farmerId }) {
  if (!name || !description || !category || price === undefined || quantity === undefined) {
    throw new ApiError(400, 'name, description, category, price, and quantity are required.');
  }
  const product = await Product.create({
    name,
    description,
    category,
    price,
    quantity,
    unit,
    farmer: farmerId,
  });
  return product;
}

async function updateProductService(id, updateFields, userId) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, 'Invalid product ID.');
  }
  const product = await Product.findOne({ _id: id, farmer: userId, isActive: true });
  if (!product) throw new ApiError(404, 'Product not found or not owned by you.');
  const allowedFields = ['name', 'description', 'category', 'price', 'quantity', 'unit', 'isActive'];
  allowedFields.forEach((field) => {
    if (updateFields[field] !== undefined) {
      product[field] = updateFields[field];
    }
  });
  await product.save();
  return product;
}

async function deleteProductService(id, userId) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, 'Invalid product ID.');
  }
  const product = await Product.findOne({ _id: id, farmer: userId, isActive: true });
  if (!product) throw new ApiError(404, 'Product not found or not owned by you.');
  product.isActive = false;
  await product.save();
  return true;
}

module.exports = {
  listProductsService,
  getProductByIdService,
  createProductService,
  updateProductService,
  deleteProductService,
};
