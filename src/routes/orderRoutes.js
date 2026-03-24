const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const Product = require("../models/Product");

// Create order
router.post("/", async (req, res) => {
  try {
    const { productId, buyerId, quantity } = req.body;

    const product = await Product.findById(productId);

    const totalPrice = product.price * quantity;

    const order = new Order({
      productId,
      buyerId,
      quantity,
      totalPrice,
    });

    await order.save();

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all orders
router.get("/", async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("productId")
      .populate("buyerId");

    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
