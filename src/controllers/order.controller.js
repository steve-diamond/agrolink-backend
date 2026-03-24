const mongoose = require('mongoose');

const Product = require('../models/Product');
const Order = require('../models/Order');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/apiError');

const createOrder = asyncHandler(async (req, res) => {
  const { items, deliveryAddress } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    throw new ApiError(400, 'Order items are required.');
  }

  const normalizedItems = items.map((item) => ({
    productId: item.productId,
    quantity: Number(item.quantity),
  }));

  normalizedItems.forEach((item) => {
    if (!mongoose.Types.ObjectId.isValid(item.productId) || !item.quantity || item.quantity < 1) {
      throw new ApiError(400, 'Each item must include a valid productId and quantity >= 1.');
    }
  });

  const productIds = normalizedItems.map((item) => item.productId);
  const products = await Product.find({ _id: { $in: productIds }, isActive: true });

  if (products.length !== productIds.length) {
    throw new ApiError(400, 'One or more products were not found or are inactive.');
  }

  const firstFarmerId = products[0].farmer.toString();
  const hasMultipleFarmers = products.some((product) => product.farmer.toString() !== firstFarmerId);

  if (hasMultipleFarmers) {
    throw new ApiError(400, 'All order items must belong to the same farmer.');
  }

  const productMap = new Map(products.map((product) => [product._id.toString(), product]));

  const orderItems = normalizedItems.map((item) => {
    const product = productMap.get(item.productId.toString());

    if (item.quantity > product.quantity) {
      throw new ApiError(400, `Insufficient quantity for product: ${product.name}.`);
    }

    const subtotal = item.quantity * product.price;

    return {
      product: product._id,
      nameSnapshot: product.name,
      quantity: item.quantity,
      unitPrice: product.price,
      subtotal,
    };
  });

  const totalAmount = orderItems.reduce((sum, item) => sum + item.subtotal, 0);

  const order = await Order.create({
    buyer: req.user._id,
    farmer: firstFarmerId,
    items: orderItems,
    totalAmount,
    deliveryAddress: deliveryAddress || '',
  });

  // Reserve stock immediately at order creation.
  await Promise.all(
    orderItems.map((item) =>
      Product.updateOne(
        { _id: item.product },
        {
          $inc: {
            quantity: -item.quantity,
          },
        }
      )
    )
  );

  const populatedOrder = await Order.findById(order._id)
    .populate('buyer', 'name email role')
    .populate('farmer', 'name email role')
    .populate('items.product', 'name category unit');

  res.status(201).json({
    status: 'success',
    data: { order: populatedOrder },
  });
});

const getMyOrders = asyncHandler(async (req, res) => {
  const filter = req.user.role === 'farmer' ? { farmer: req.user._id } : { buyer: req.user._id };

  const orders = await Order.find(filter)
    .sort('-createdAt')
    .populate('buyer', 'name email role')
    .populate('farmer', 'name email role')
    .populate('items.product', 'name category unit');

  res.status(200).json({
    status: 'success',
    data: {
      items: orders,
      total: orders.length,
    },
  });
});

const getOrderById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, 'Invalid order ID.');
  }

  const order = await Order.findById(id)
    .populate('buyer', 'name email role')
    .populate('farmer', 'name email role')
    .populate('items.product', 'name category unit');

  if (!order) {
    throw new ApiError(404, 'Order not found.');
  }

  const isOwner =
    order.buyer._id.toString() === req.user._id.toString() ||
    order.farmer._id.toString() === req.user._id.toString();

  if (!isOwner) {
    throw new ApiError(403, 'You are not allowed to view this order.');
  }

  res.status(200).json({
    status: 'success',
    data: { order },
  });
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

  const order = await Order.findById(id);

  if (!order) {
    throw new ApiError(404, 'Order not found.');
  }

  if (order.farmer.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Only the owning farmer can update this order status.');
  }

  order.status = status;
  await order.save();

  res.status(200).json({
    status: 'success',
    data: { order },
  });
});

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  updateOrderStatus,
};
