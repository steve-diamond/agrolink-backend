const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
			trim: true,
		},
		price: {
			type: Number,
			required: true,
			min: 0,
		},
		quantity: {
			type: Number,
			required: true,
			min: 0,
		},
		category: {
			type: String,
			default: "",
			trim: true,
		},
		location: {
			type: String,
			required: true,
			trim: true,
		},
		description: {
			type: String,
			default: "",
			trim: true,
		},
		imageUrl: {
			type: String,
			default: "",
			trim: true,
		},
		farmer: {
			type: String,
			required: true,
			index: true,
		},
		approved: {
			type: Boolean,
			default: false,
		},
		isActive: {
			type: Boolean,
			default: true,
			index: true,
		},
	},
	{ timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
