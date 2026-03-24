const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const { protect, authorize } = require("../middleware/auth.middleware");

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function parsePositiveNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

// Create product
router.post("/", protect, authorize("farmer"), async (req, res) => {
  try {
    if (!req.user?.approved) {
      return res.status(403).json({
        error: "Your farmer account is pending admin approval. You cannot sell yet.",
      });
    }

    const name = normalizeString(req.body?.name);
    const location = normalizeString(req.body?.location);
    const farmer = normalizeString(req.body?.farmer);
    const price = parsePositiveNumber(req.body?.price);
    const quantity = parsePositiveNumber(req.body?.quantity);

    if (!name || !location || price === null || quantity === null) {
      return res.status(400).json({
        error: "Invalid payload. Provide name, location, and positive numeric price and quantity.",
      });
    }

    const product = new Product({
      name,
      price,
      quantity,
      location,
      farmer: farmer || undefined,
    });

    const saved = await product.save();
    res.status(201).json(saved);
  } catch (error) {
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({ error: error.message });
  }
});

// Get all products
router.get("/", async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
