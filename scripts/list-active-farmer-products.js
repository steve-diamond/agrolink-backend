// node scripts/list-active-farmer-products.js
const mongoose = require('mongoose');
const Subscription = require('../models/Subscription');
const Product = require('../models/Product');
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost/agrolink';

async function listActiveFarmerProducts() {
  await mongoose.connect(MONGO_URI);
  const activeSubs = await Subscription.find({ status: 'active', endDate: { $gt: new Date() } });
  for (const sub of activeSubs) {
    await Product.updateMany({ farmer: sub.user.toString() }, { isActive: true });
    console.log(`Listed products for farmer ${sub.user}`);
  }
  await mongoose.disconnect();
}

listActiveFarmerProducts();
