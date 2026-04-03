const mongoose = require('mongoose');

const LoanSchema = new mongoose.Schema({
	farmer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
	amount: { type: Number, required: true },
	purpose: { type: String, trim: true, required: true },
	farmSize: { type: Number, min: 0 },
	cooperativeRating: { type: Number, min: 0, max: 5 },
	salesScore: { type: Number, min: 0, max: 100 },
	requestedTermMonths: { type: Number, min: 1 },
	status: { type: String, enum: ['pending', 'approved', 'rejected', 'repaid'], default: 'pending' },
	issuedAt: { type: Date },
	dueDate: { type: Date },
	reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
	reviewedAt: { type: Date },
	reviewNotes: { type: String, trim: true, default: '' },
	repaidAt: { type: Date },
}, { timestamps: true });

LoanSchema.index({ farmer: 1, createdAt: -1 });
LoanSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Loan', LoanSchema);
