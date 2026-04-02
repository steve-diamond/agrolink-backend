const mongoose = require("mongoose");

// Each line-item in the order
const orderProductSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    // The buyer who placed the order
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    products: {
      type: [orderProductSchema],
      required: true,
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: "At least one product is required.",
      },
    },
    totalAmount: { type: Number, required: true, min: 0 },
    commission: { type: Number, required: true, min: 0, default: 0 },
    status: {
      type: String,
      enum: ["pending", "paid", "confirmed", "shipped", "delivered", "cancelled"],
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },
    paymentReference: { type: String, default: null },
  },
  { timestamps: true }
);

// ---------- Indexes ----------
// Buyer order history (most common read)
orderSchema.index({ user: 1, createdAt: -1 });
// Admin: filter by status
orderSchema.index({ status: 1, createdAt: -1 });
// Payment reconciliation
orderSchema.index({ paymentStatus: 1 });
// Payment reference lookup (unique-ish)
orderSchema.index({ paymentReference: 1 }, { sparse: true });

module.exports = mongoose.model("Order", orderSchema);
