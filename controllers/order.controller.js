const mongoose = require('mongoose');

const Product = require('../models/Product');
const Order = require('../models/Order');
const path = require('path');
const asyncHandler = require(path.join(__dirname, '..', 'utils', 'asyncHandler'));
const ApiError = require(path.join(__dirname, '..', 'utils', 'apiError'));
const { enqueueSms } = require('../services/notificationQueue');

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

    // ── Atomic stock reservation via MongoDB multi-document transaction ──
    // Without a transaction, two concurrent buyers could both pass the quantity
    // check and over-sell the last unit.  The findOneAndUpdate with the
    // $inc + condition acts as a compare-and-swap at the DB layer.
    const session = await mongoose.startSession();
    let populatedOrder;

    try {
      await session.withTransaction(async () => {
        const productIds = normalizedItems.map((item) => item.productId);

        // Fetch inside the transaction so we see the latest committed state.
        const dbProducts = await Product.find({ _id: { $in: productIds } }).session(session);

        if (dbProducts.length !== productIds.length) {
          throw new ApiError(400, 'One or more products were not found.');
        }

        const productMap = new Map(dbProducts.map((p) => [p._id.toString(), p]));

        const orderProducts = normalizedItems.map((item) => {
          const product = productMap.get(item.productId.toString());
          if (!product.approved) {
            throw new ApiError(400, `Product is not approved for sale: ${product.name}.`);
          }
          if (item.quantity > product.quantity) {
            throw new ApiError(400, `Insufficient stock for product: ${product.name}.`);
          }
          return { productId: product._id, quantity: item.quantity };
        });

        const totalAmount = normalizedItems.reduce((sum, item) => {
          const product = productMap.get(item.productId.toString());
          return sum + product.price * item.quantity;
        }, 0);

        const commission = Number((totalAmount * 0.1).toFixed(2));

        // Atomically decrement stock – the $gte guard prevents going negative.
        await Promise.all(
          orderProducts.map((item) =>
            Product.findOneAndUpdate(
              { _id: item.productId, quantity: { $gte: item.quantity } },
              { $inc: { quantity: -item.quantity } },
              { session, new: true }
            ).then((updated) => {
              if (!updated) {
                throw new ApiError(409, 'Stock was exhausted by a concurrent order. Please try again.');
              }
            })
          )
        );

        const [order] = await Order.create(
          [{ user: req.user._id, products: orderProducts, totalAmount, commission, status: 'pending', paymentStatus: 'pending' }],
          { session }
        );

        populatedOrder = await Order.findById(order._id)
          .session(session)
          .populate('user', 'name email role')
          .populate('products.productId', 'name price location farmer');
      });
    } finally {
      session.endSession();
    }

    res.status(201).json(serializeOrder(populatedOrder));
  });

const getUserOrders = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    Order.find({ user: req.user._id })
      .sort('-createdAt')
      .skip(skip)
      .limit(limit)
      .populate('user', 'name email role')
      .populate('products.productId', 'name price location farmer'),
    Order.countDocuments({ user: req.user._id }),
  ]);

  res.status(200).json({
    data: orders.map(serializeOrder),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  });
});

const getAllOrders = asyncHandler(async (_req, res) => {
  const req = _req;
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 200);
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.paymentStatus) filter.paymentStatus = req.query.paymentStatus;

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .sort('-createdAt')
      .skip(skip)
      .limit(limit)
      .populate('user', 'name email role')
      .populate('products.productId', 'name price location farmer'),
    Order.countDocuments(filter),
  ]);

  res.status(200).json({
    data: orders.map(serializeOrder),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  });
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

  const wasDelivered = order.status === 'delivered';

  order.status = status;
  if (status === 'paid') {
    order.paymentStatus = 'paid';
  }

  // Credit farmer wallet once when transitioning into delivered.
  if (status === 'delivered' && !wasDelivered) {
    const WalletController = require(path.join(__dirname, 'wallet.controller'));
    const User = require('../models/User');

    for (const item of order.products) {
      const product = item.productId;
      if (!product || !product.farmer) continue;

      const farmer = await User.findById(product.farmer);
      if (!farmer) continue;

      const productTotal = product.price * item.quantity;
      const commission = Number((productTotal * 0.1).toFixed(2));
      const farmerAmount = productTotal - commission;

      await WalletController.creditWallet(
        farmer._id,
        farmerAmount,
        order._id,
        `Order delivered: ${order._id}`
      );

      if (farmer.phone) {
        await enqueueSms({
          to: farmer.phone,
          message: `Your order has been delivered. NGN ${farmerAmount} credited to your wallet.`,
          correlationId: String(order._id),
        });
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
