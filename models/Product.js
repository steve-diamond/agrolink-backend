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
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		approved: {
			type: Boolean,
			default: false,
		},
		isActive: {
			type: Boolean,
			default: true,
		},
	},
	{ timestamps: true }
);

// ---------- Indexes ----------
// Marketplace listing: active, approved, sorted by date
productSchema.index({ isActive: 1, approved: 1, createdAt: -1 });
// Category + active filter (most common query in browse)
productSchema.index({ isActive: 1, category: 1, createdAt: -1 });
// Farmer dashboard: all their products
productSchema.index({ farmer: 1, isActive: 1 });
// Full-text search on name + description
productSchema.index({ name: 'text', description: 'text' });
// Price range filter
productSchema.index({ price: 1 });

module.exports = mongoose.model("Product", productSchema);
