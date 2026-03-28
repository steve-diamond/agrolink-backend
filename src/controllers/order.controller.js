const mongoose = require('mongoose');

const Product = require('../models/Product');
const Order = require('../models/Order');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/apiError');

const serializeOrder = (order) => {
  const rawOrder = typeof order.toObject === 'function' ? order.toObject() : order;
  const firstProduct = rawOrder.products?.[0] || null;
  const quantity = (rawOrder.products || []).reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

  return {
    ...rawOrder,
    buyerId: rawOrder.user,
    productId: firstProduct?.productId || null,
    quantity,
    totalPrice: rawOrder.totalAmount,
  };
};

const createOrder = asyncHandler(async (req, res) => {
  const { items, products, productId, quantity } = req.body;

  const inputItems = Array.isArray(items) && items.length > 0
    ? items
    : Array.isArray(products) && products.length > 0
    ? products
    : [{ productId, quantity }];

  if (!Array.isArray(inputItems) || inputItems.length === 0) {
    throw new ApiError(400, 'Order items are required.');
  }

  const normalizedItems = inputItems.map((item) => ({
    productId: item.productId,
    quantity: Number(item.quantity),
  }));

  normalizedItems.forEach((item) => {
    if (!mongoose.Types.ObjectId.isValid(item.productId) || !item.quantity || item.quantity < 1) {
      throw new ApiError(400, 'Each item must include a valid productId and quantity >= 1.');
    }
  });

  const productIds = normalizedItems.map((item) => item.productId);
  const products = await Product.find({ _id: { $in: productIds } });

  if (products.length !== productIds.length) {
    throw new ApiError(400, 'One or more products were not found.');
  }

  const productMap = new Map(products.map((product) => [product._id.toString(), product]));

  const orderProducts = normalizedItems.map((item) => {
    const product = productMap.get(item.productId.toString());

    if (item.quantity > product.quantity) {
      throw new ApiError(400, `Insufficient quantity for product: ${product.name}.`);
    }

    return {
      productId: product._id,
      quantity: item.quantity,
    };
  });

  const totalAmount = normalizedItems.reduce((sum, item) => {
    const product = productMap.get(item.productId.toString());
    return sum + (product.price * item.quantity);
  }, 0);

  const order = await Order.create({
    user: req.user._id,
    products: orderProducts,
    totalAmount,
    status: 'pending',
    paymentStatus: 'pending',
  });

  // Reserve stock immediately at order creation.
  await Promise.all(
    orderProducts.map((item) =>
      Product.updateOne(
        { _id: item.productId },
        {
          $inc: {
            quantity: -item.quantity,
          },
        }
      )
    )
  );

  const populatedOrder = await Order.findById(order._id)
    .populate('user', 'name email role')
    .populate('products.productId', 'name price location farmer');

  res.status(201).json(serializeOrder(populatedOrder));
});

const getUserOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id })
    .sort('-createdAt')
    .populate('user', 'name email role')
    .populate('products.productId', 'name price location farmer');

  res.status(200).json(orders.map(serializeOrder));
});

const getAllOrders = asyncHandler(async (_req, res) => {
  const orders = await Order.find()
    .sort('-createdAt')
    .populate('user', 'name email role')
    .populate('products.productId', 'name price location farmer');

  res.status(200).json(orders.map(serializeOrder));
});

const getOrderById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, 'Invalid order ID.');
  }

  const order = await Order.findById(id)
    .populate('user', 'name email role')
    .populate('products.productId', 'name price location farmer');

  if (!order) {
    throw new ApiError(404, 'Order not found.');
  }

  const isOwner = order.user._id.toString() === req.user._id.toString();

  if (!isOwner) {
    throw new ApiError(403, 'You are not allowed to view this order.');
  }

  res.status(200).json(serializeOrder(order));
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, 'Invalid order ID.');
  }

  if (!status) {
    throw new ApiError(400, 'status is required.');
  }

  if (!['pending', 'paid', 'delivered'].includes(status)) {
    throw new ApiError(400, 'Invalid status value.');
  }

  const order = await Order.findById(id).populate('products.productId', 'farmer');

  if (!order) {
    throw new ApiError(404, 'Order not found.');
  }

  const isOwningFarmer = order.products.some(
    (item) => item.productId && item.productId.farmer === req.user.name
  );

  if (!isOwningFarmer) {
    throw new ApiError(403, 'Only the owning farmer can update this order status.');
  }

  order.status = status;
  if (status === 'paid') {
    order.paymentStatus = 'paid';
  }
  await order.save();

  const updatedOrder = await Order.findById(id)
    .populate('user', 'name email role')
    .populate('products.productId', 'name price location farmer');

  res.status(200).json(serializeOrder(updatedOrder));
});

module.exports = {
  createOrder,
  getUserOrders,
  getMyOrders: getUserOrders,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
};
