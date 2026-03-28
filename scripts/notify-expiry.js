// node scripts/notify-expiry.js
const mongoose = require('mongoose');
const Subscription = require('../models/Subscription');
const User = require('../models/User');
const nodemailer = require('nodemailer');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost/agrolink';
const EMAIL_FROM = process.env.EMAIL_FROM || 'no-reply@agrolink.com';
const SMTP_URL = process.env.SMTP_URL || '';

async function notifyExpiringSubscriptions() {
  await mongoose.connect(MONGO_URI);
  const now = new Date();
  const soon = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days
  const expiring = await Subscription.find({ status: 'active', endDate: { $lte: soon, $gt: now } }).populate('user');
  if (!SMTP_URL) {
    console.log('SMTP_URL not set, skipping email notifications.');
    return;
  }
  const transporter = nodemailer.createTransport(SMTP_URL);
  for (const sub of expiring) {
    if (!sub.user?.email) continue;
    await transporter.sendMail({
      from: EMAIL_FROM,
      to: sub.user.email,
      subject: 'Your Agrolink subscription is expiring soon',
      text: `Dear ${sub.user.name || 'Farmer'},\n\nYour subscription will expire on ${sub.endDate.toLocaleDateString()}. Please renew to continue listing your products.\n\nThank you!`,
    });
    console.log(`Notified ${sub.user.email}`);
  }
  await mongoose.disconnect();
}

notifyExpiringSubscriptions();
