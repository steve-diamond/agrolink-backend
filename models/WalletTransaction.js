const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const WalletTransactionSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['credit', 'debit'], required: true },
  amount: { type: Number, required: true },
  reference: { type: String },
  description: { type: String },
}, { timestamps: true });

// ---------- Indexes ----------
// User transaction history with type filter (walletController.filterTransactions)
WalletTransactionSchema.index({ user: 1, type: 1, createdAt: -1 });
// Date-range queries across all users (admin reporting)
WalletTransactionSchema.index({ createdAt: -1 });
// Idempotency check on payment reference
WalletTransactionSchema.index({ reference: 1 }, { sparse: true });

module.exports = mongoose.model('WalletTransaction', WalletTransactionSchema);
