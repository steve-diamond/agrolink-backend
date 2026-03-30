const mongoose = require("mongoose");

const withdrawalSchema = new mongoose.Schema(
	{
		user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
		amount: { type: Number, required: true, min: 0 },
		status: {
			type: String,
			enum: ["pending", "approved", "rejected", "completed"],
			default: "pending",
		},
		method: { type: String, default: "", trim: true },
		reference: { type: String, default: "", trim: true },
		processedAt: { type: Date, default: null },
		rejectionReason: { type: String, default: "", trim: true },
		bankDetails: {
			accountName: { type: String, required: true },
			accountNumber: { type: String, required: true },
			bankName: { type: String, required: true },
		},
		adminNote: { type: String, default: "" },
		paidAt: { type: Date },
	},
	{ timestamps: true }
);

module.exports = mongoose.model("Withdrawal", withdrawalSchema);
