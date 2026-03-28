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

function buildProductFilter(query = {}) {
  const filter = {};

  if (typeof query.farmer === "string" && query.farmer.trim()) {
    filter.farmer = query.farmer.trim();
  }

  if (typeof query.category === "string" && query.category.trim()) {
    filter.category = query.category.trim();
  }

  if (typeof query.approved === "string") {
    filter.approved = query.approved === "true";
  }

  if (typeof query.search === "string" && query.search.trim()) {
    const search = query.search.trim();
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { category: { $regex: search, $options: "i" } },
      { location: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  const minPrice = Number(query.minPrice);
  const maxPrice = Number(query.maxPrice);

  if (Number.isFinite(minPrice) || Number.isFinite(maxPrice)) {
    filter.price = {};
    if (Number.isFinite(minPrice)) {
      filter.price.$gte = minPrice;
    }
    if (Number.isFinite(maxPrice)) {
      filter.price.$lte = maxPrice;
    }
  }

  return filter;
}

function normalizeProductPayload(body = {}) {
  return {
    name: normalizeString(body.name),
    category: normalizeString(body.category),
    location: normalizeString(body.location),
    description: normalizeString(body.description),
    imageUrl: normalizeString(body.imageUrl),
    price: parsePositiveNumber(body.price),
    quantity: parsePositiveNumber(body.quantity),
  };
}

// Create product
router.post("/", protect, authorize("farmer"), async (req, res) => {
  try {
    const { name, category, location, description, imageUrl, price, quantity } = normalizeProductPayload(req.body);

    if (!name || !category || !location || !description || price === null || quantity === null) {
      return res.status(400).json({
        error: "Invalid payload. Provide name, category, location, description, and positive numeric price and quantity.",
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
      farmer: req.user._id.toString(),
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

router.get("/mine", protect, authorize("farmer"), async (req, res) => {
  try {
    const products = await Product.find({ farmer: req.user._id.toString() }).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all products
router.get("/", async (req, res) => {
  try {
    const products = await Product.find(buildProductFilter(req.query)).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json(product);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put("/:id", protect, authorize("farmer"), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    if (product.farmer !== req.user._id.toString()) {
      return res.status(403).json({ error: "You can only update your own products." });
    }

    const updates = normalizeProductPayload(req.body);

    if (updates.name) product.name = updates.name;
    if (updates.category) product.category = updates.category;
    if (updates.location) product.location = updates.location;
    if (updates.description) product.description = updates.description;
    if (req.body.imageUrl !== undefined) {
      if (updates.imageUrl && !isValidHttpUrl(updates.imageUrl)) {
        return res.status(400).json({ error: "imageUrl must be a valid http/https URL." });
      }
      product.imageUrl = updates.imageUrl;
    }
    if (updates.price !== null) product.price = updates.price;
    if (updates.quantity !== null) product.quantity = updates.quantity;

    await product.save();
    res.json(product);
  } catch (error) {
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({ error: error.message });
  }
});

router.delete("/:id", protect, authorize("farmer"), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    if (product.farmer !== req.user._id.toString()) {
      return res.status(403).json({ error: "You can only delete your own products." });
    }

    await product.deleteOne();
    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
