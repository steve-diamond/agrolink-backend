const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
		},
		price: {
			type: Number,
			required: true,
		},
		quantity: {
			type: Number,
			required: true,
		},
		category: {
			type: String,
			default: "",
		},
		location: {
			type: String,
			required: true,
		},
		description: {
			type: String,
			default: "",
		},
		imageUrl: {
			type: String,
			default: "",
		},
		farmer: {
			type: String,
		},
		approved: {
			type: Boolean,
			default: false,
		},
	},
	{ timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
