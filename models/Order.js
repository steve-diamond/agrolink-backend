const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
	{
		product: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Product",
			required: true,
		},
		buyer: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		quantity: {
			type: Number,
			required: true,
			min: 1,
		},
		totalPrice: {
			type: Number,
			required: true,
			min: 0,
		},
		status: {
			type: String,
			enum: ["pending", "confirmed", "shipped", "delivered", "cancelled"],
			default: "pending",
		},
		deliveryAddress: {
			type: String,
			required: true,
			trim: true,
		},
		paymentStatus: {
			type: String,
			enum: ["pending", "paid", "failed"],
			default: "pending",
		},
		paymentMethod: {
			type: String,
			default: "",
			trim: true,
		},
		farmer: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		orderType: {
			type: String,
			enum: ["marketplace", "subscription"],
			default: "marketplace",
		},
		subscription: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Subscription",
			default: null,
		},
	},
	{ timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
