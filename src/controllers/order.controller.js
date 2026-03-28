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
    commission: rawOrder.commission,
  };
};

const createOrder = asyncHandler(async (req, res) => {
  const { items, products: requestProducts, productId, quantity } = req.body;

  const inputItems = Array.isArray(items) && items.length > 0
    ? items
    : Array.isArray(requestProducts) && requestProducts.length > 0
    ? requestProducts
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
  const dbProducts = await Product.find({ _id: { $in: productIds } });

  if (dbProducts.length !== productIds.length) {
    throw new ApiError(400, 'One or more products were not found.');
  }

  const productMap = new Map(dbProducts.map((product) => [product._id.toString(), product]));

  const orderProducts = normalizedItems.map((item) => {
    const product = productMap.get(item.productId.toString());

    if (!product.approved) {
      throw new ApiError(400, `Product is not approved for sale: ${product.name}.`);
    }

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

  // Fixed 10% commission
  const commission = Number((totalAmount * 0.10).toFixed(2));

  const order = await Order.create({
    user: req.user._id,
    products: orderProducts,
    totalAmount,
    commission,
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
    (item) => item.productId && String(item.productId.farmer) === req.user._id.toString()
  );

  if (!isOwningFarmer) {
    throw new ApiError(403, 'Only the owning farmer can update this order status.');
  }

  order.status = status;
  if (status === 'paid') {
    order.paymentStatus = 'paid';
  }
  // Credit farmer wallet when delivered
  if (status === 'delivered' && order.status !== 'delivered') {
    // For each product, credit the farmer
    const WalletController = require('./wallet.controller');
    const User = require('../models/User');
    for (const item of order.products) {
      const product = item.productId;
      if (!product || !product.farmer) continue;
      // Find farmer user
      const farmer = await User.findById(product.farmer);
      if (!farmer) continue;
      // Calculate commission and farmer earning
      const productTotal = product.price * item.quantity;
      const commission = Number((productTotal * 0.1).toFixed(2)); // 10% commission
      const farmerAmount = productTotal - commission;
      // Credit farmer wallet
      await WalletController.creditWallet(farmer._id, farmerAmount, order._id, `Order delivered: ${order._id}`);
      // Send SMS if phone number exists
      if (farmer.phone) {
        const { sendSMS } = require('../../services/smsService');
        sendSMS(farmer.phone, `Your order has been delivered. ₦${farmerAmount} credited to your wallet.`);
      }
    }
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
