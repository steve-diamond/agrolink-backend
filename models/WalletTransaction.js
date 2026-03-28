const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const WalletTransactionSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['credit', 'debit'], required: true },
  amount: { type: Number, required: true },
  reference: { type: String },
  description: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('WalletTransaction', WalletTransactionSchema);
