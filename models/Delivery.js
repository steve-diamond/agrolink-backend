const mongoose = require("mongoose");

const deliverySchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      unique: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // delivery agent
      required: false,
    },
    status: {
      type: String,
      enum: ["pending", "assigned", "picked_up", "in_transit", "delivered", "cancelled"],
      default: "pending",
    },
    trackingCode: {
      type: String,
      default: null,
    },
    locationHistory: [
      {
        timestamp: { type: Date, default: Date.now },
        location: { type: String },
        status: { type: String },
      },
    ],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Delivery", deliverySchema);
