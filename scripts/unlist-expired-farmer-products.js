// node scripts/unlist-expired-farmer-products.js
const mongoose = require('mongoose');
const Subscription = require('../models/Subscription');
const Product = require('../models/Product');
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost/agrolink';

async function unlistExpiredFarmerProducts() {
  await mongoose.connect(MONGO_URI);
  const expiredSubs = await Subscription.find({ status: 'expired' });
  for (const sub of expiredSubs) {
    await Product.updateMany({ farmer: sub.user.toString() }, { isActive: false });
    console.log(`Unlisted products for farmer ${sub.user}`);
  }
  await mongoose.disconnect();
}

unlistExpiredFarmerProducts();
