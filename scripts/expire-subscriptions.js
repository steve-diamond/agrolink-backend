// node scripts/expire-subscriptions.js
const mongoose = require('mongoose');
const Subscription = require('../models/Subscription');
const SubscriptionHistory = require('../models/SubscriptionHistory');
const User = require('../models/User');

const MONGO_URI = process.env.MONGODB_URI;

if (!MONGO_URI) {
  throw new Error('MONGODB_URI is required to run expire-subscriptions.js');
}

async function expireSubscriptions() {
  await mongoose.connect(MONGO_URI);
  const now = new Date();
  const expiring = await Subscription.find({ status: 'active', endDate: { $lte: now } });
  for (const sub of expiring) {
    sub.status = 'expired';
    await sub.save();
    // Add to history
    await SubscriptionHistory.create({
      user: sub.user,
      startDate: sub.startDate,
      endDate: sub.endDate,
      paymentReference: sub.paymentReference,
      amount: 2000, // Should match fee
      status: 'expired',
    });
    // Notification delivery is handled by downstream engagement workers.
  }
  await mongoose.disconnect();
  console.log(`Expired ${expiring.length} subscriptions.`);
}

expireSubscriptions();
