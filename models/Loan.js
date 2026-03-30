const mongoose = require('mongoose');

const LoanSchema = new mongoose.Schema({
	farmer: { type: mongoose.Schema.Types.ObjectId, ref: 'Farmer', required: true },
	amount: { type: Number, required: true },
	status: { type: String, enum: ['pending', 'approved', 'rejected', 'repaid'], default: 'pending' },
	issuedAt: { type: Date },
	dueDate: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Loan', LoanSchema);
