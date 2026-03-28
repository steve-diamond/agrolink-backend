const mongoose = require('mongoose');

const Product = require('../models/Product');
const asyncHandler = require('../../../src/utils/asyncHandler');
const ApiError = require('../../../src/utils/apiError');

const listProducts = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    category,
    search,
    minPrice,
    maxPrice,
    sort = '-createdAt',
  } = req.query;

  const pageNumber = Math.max(Number(page), 1);
  const limitNumber = Math.min(Math.max(Number(limit), 1), 100);

  const filter = { isActive: true };

  if (category) {
    filter.category = category;
  }

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) {
      filter.price.$gte = Number(minPrice);
    }
    if (maxPrice) {
      filter.price.$lte = Number(maxPrice);
    }
  }

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate('farmer', 'name email role')
      .sort(sort)
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber),
    Product.countDocuments(filter),
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      items: products,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        totalPages: Math.ceil(total / limitNumber) || 1,
      },
    },
  });
});

const getProductById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, 'Invalid product ID.');
  }

  const product = await Product.findOne({ _id: id, isActive: true }).populate('farmer', 'name email role');

  if (!product) {
    throw new ApiError(404, 'Product not found.');
  }

  res.status(200).json({
    status: 'success',
    data: { product },
  });
});

const createProduct = asyncHandler(async (req, res) => {
  const { name, description, category, price, quantity, unit } = req.body;

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
    farmer: req.user._id,
  });

  res.status(201).json({
    status: 'success',
    data: { product },
  });
});

const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, 'Invalid product ID.');
  }

  const product = await Product.findOne({ _id: id, farmer: req.user._id, isActive: true });

  if (!product) {
    throw new ApiError(404, 'Product not found or not owned by you.');
  }

  const allowedFields = ['name', 'description', 'category', 'price', 'quantity', 'unit', 'isActive'];
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      product[field] = req.body[field];
    }
  });

  await product.save();

  res.status(200).json({
    status: 'success',
    data: { product },
  });
});

const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, 'Invalid product ID.');
  }

  const product = await Product.findOne({ _id: id, farmer: req.user._id, isActive: true });

  if (!product) {
    throw new ApiError(404, 'Product not found or not owned by you.');
  }

  product.isActive = false;
  await product.save();

  res.status(200).json({
    status: 'success',
    message: 'Product deleted successfully.',
  });
});

module.exports = {
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
