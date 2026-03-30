const mongoose = require('mongoose');

const LoanRepaymentSchema = new mongoose.Schema({
	loan: { type: mongoose.Schema.Types.ObjectId, ref: 'Loan', required: true },
	amount: { type: Number, required: true },
	paidAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('LoanRepayment', LoanRepaymentSchema);
