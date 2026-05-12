require('dotenv').config();
// Fix for XAMPP/Windows c-ares DNS issue — use Google DNS for SRV resolution
require('dns').setServers(['8.8.8.8', '8.8.4.4']);
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI;
const ADMIN_EMAIL = 'admin@agrolink.com';
const ADMIN_PASSWORD = 'agro123456';
const ADMIN_NAME = 'Admin';

console.log('🔍 Connecting to:', MONGODB_URI?.replace(/:[^:]*@/, ':***@'));

mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 15000,
  socketTimeoutMS: 15000,
})
.then(async () => {
  console.log('✅ Connected to MongoDB');

  const UserSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true, lowercase: true },
    password: { type: String, select: false },
    role: { type: String, enum: ['farmer', 'buyer', 'admin'], default: 'buyer' },
    approved: { type: Boolean, default: false },
  }, { timestamps: true });

  UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
  });

  const User = mongoose.model('User', UserSchema);

  let user = await User.findOne({ email: ADMIN_EMAIL }).select('+password');

  if (!user) {
    user = new User({
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      role: 'admin',
      approved: true,
    });
    await user.save();
    console.log(`✅ Created admin user: ${ADMIN_EMAIL}`);
  } else {
    user.password = ADMIN_PASSWORD;
    user.role = 'admin';
    user.approved = true;
    await user.save();
    console.log(`✅ Updated admin user: ${ADMIN_EMAIL}`);
  }

  await mongoose.connection.close();
  console.log('✅ Done!');
  process.exit(0);
})
.catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
