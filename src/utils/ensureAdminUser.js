const User = require('../models/User');

const ensureAdminUser = async () => {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME || 'Admin';

  if (!email || !password) {
    console.warn('ADMIN_EMAIL or ADMIN_PASSWORD is not set. Skipping admin bootstrap.');
    return;
  }

  let user = await User.findOne({ email }).select('+password');

  if (!user) {
    user = new User({
      name,
      email,
      password,
      role: 'admin',
      approved: true,
    });
    await user.save();
    console.log(`Bootstrapped admin user: ${email}`);
    return;
  }

  user.name = user.name || name;
  user.password = password;
  user.role = 'admin';
  user.approved = true;
  await user.save();
  console.log(`Ensured admin user credentials: ${email}`);
};

module.exports = ensureAdminUser;
