const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const WalletSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  balance: { type: Number, default: 0 },
  currency: { type: String, default: 'NGN' },
  locked: { type: Boolean, default: false },
  transactions: [{ type: Schema.Types.ObjectId, ref: 'WalletTransaction' }],
}, { timestamps: true });

module.exports = mongoose.model('Wallet', WalletSchema);
