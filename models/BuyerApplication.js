const mongoose = require('mongoose');

const BuyerApplicationSchema = new mongoose.Schema(
  {
    applicationId: { type: String },
    status: {
      type: String,
      enum: ['draft', 'pending', 'approved', 'rejected', 'activation_completed', 'queued'],
      default: 'pending',
    },
    account: {
      name: { type: String, required: true, trim: true },
      email: { type: String, required: true, trim: true, lowercase: true },
      phone: { type: String, required: true, trim: true },
    },
    application: { type: mongoose.Schema.Types.Mixed, required: true },
  },
  { timestamps: true }
);

BuyerApplicationSchema.index({ 'account.email': 1 }, { unique: true });
BuyerApplicationSchema.index({ applicationId: 1 }, { unique: true });

module.exports = mongoose.model('BuyerApplication', BuyerApplicationSchema);
