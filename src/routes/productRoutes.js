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

function isValidHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
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
    const category = normalizeString(req.body?.category);
    const location = normalizeString(req.body?.location);
    const description = normalizeString(req.body?.description);
    const imageUrl = normalizeString(req.body?.imageUrl);
    const farmer = normalizeString(req.body?.farmer);
    const price = parsePositiveNumber(req.body?.price);
    const quantity = parsePositiveNumber(req.body?.quantity);

    if (!name || !location || price === null || quantity === null) {
      return res.status(400).json({
        error: "Invalid payload. Provide name, location, and positive numeric price and quantity.",
      });
    }

    if (imageUrl && !isValidHttpUrl(imageUrl)) {
      return res.status(400).json({
        error: "imageUrl must be a valid http/https URL.",
      });
    }

    const product = new Product({
      name,
      price,
      quantity,
      category,
      location,
      description,
      imageUrl,
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
