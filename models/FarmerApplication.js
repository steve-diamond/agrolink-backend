const mongoose = require('mongoose');

const FarmerApplicationSchema = new mongoose.Schema(
  {
    applicationId: { type: String, index: true },
    status: {
      type: String,
      enum: ['draft', 'submitted', 'queued'],
      default: 'submitted',
    },
    account: {
      name: { type: String, required: true, trim: true },
      email: { type: String, required: true, trim: true, lowercase: true, index: true },
      phone: { type: String, required: true, trim: true },
    },
    application: { type: mongoose.Schema.Types.Mixed, required: true },
  },
  { timestamps: true }
);

FarmerApplicationSchema.index({ 'account.email': 1 }, { unique: true });

module.exports = mongoose.model('FarmerApplication', FarmerApplicationSchema);
