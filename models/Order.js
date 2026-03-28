const mongoose = require("mongoose");

const orderProductSchema = new mongoose.Schema(
	{
		productId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Product",
			required: true,
		},
		quantity: {
			type: Number,
			required: true,
			min: 1,
		},
	},
	{ _id: false }
);

const orderSchema = new mongoose.Schema(
	{
		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		products: {
			type: [orderProductSchema],
			required: true,
			validate: {
				validator: (value) => Array.isArray(value) && value.length > 0,
				message: "At least one product is required.",
			},
		},
		totalAmount: {
			type: Number,
			required: true,
			min: 0,
		},
		status: {
			type: String,
			enum: ["pending", "paid", "delivered"],
			default: "pending",
		},
		paymentStatus: {
			type: String,
			enum: ["pending", "paid"],
			default: "pending",
		},
		createdAt: {
			type: Date,
			default: Date.now,
		},
	},
	{ versionKey: false }
);

module.exports = mongoose.model("Order", orderSchema);
