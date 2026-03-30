const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
	user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
	amount: { type: Number, required: true },
	type: { type: String, enum: ['credit', 'debit'], required: true },
	reference: { type: String },
	description: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Transaction', TransactionSchema);
