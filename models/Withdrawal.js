const mongoose = require('mongoose');

const withdrawalSchema = new mongoose.Schema(
	{
		user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
		amount: { type: Number, required: true },
		status: {
			type: String,
			enum: ['pending', 'approved', 'paid', 'refunded'],
			default: 'pending',
		},
		bankDetails: {
			accountName: { type: String, required: true },
			accountNumber: { type: String, required: true },
			bankName: { type: String, required: true },
		},
		adminNote: { type: String, default: '' },
		paidAt: { type: Date },
	},
	{ timestamps: true }
);

module.exports = mongoose.model('Withdrawal', withdrawalSchema);
