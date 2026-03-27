const express = require('express');
const cors = require('cors');

const apiRoutes = require('./routes');
const adminRoutes = require('./routes/adminRoutes');
const authRoutes = require('./routes/authRoutes');
const orderRoutes = require('./routes/orderRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const productRoutes = require('./routes/productRoutes');
const User = require('./models/User');
const { notFoundHandler, errorHandler } = require('./middleware/error.middleware');

const app = express();

const configuredOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim())
  : ['*'];

const corsOrigin = configuredOrigins.includes('*') ? true : configuredOrigins;

app.use(cors({ origin: corsOrigin }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.send('AgroLink Backend is running...');
});

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Agrolink API is healthy',
    timestamp: new Date().toISOString(),
  });
});

app.get('/check-users', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
});

app.get('/create-admin', async (req, res) => {
  try {
    let user = await User.findOne({ email: 'admin@agrolink.com' });
    
    if (!user) {
      user = new User({
        name: 'Admin',
        email: 'admin@agrolink.com',
        password: 'AgroLinkAdmin123!',
        role: 'admin',
        approved: true,
      });
      await user.save();
      res.json({ status: 'success', message: 'Admin user created', user: { email: user.email, role: user.role } });
    } else {
      user.password = 'AgroLinkAdmin123!';
      user.role = 'admin';
      user.approved = true;
      await user.save();
      res.json({ status: 'success', message: 'Admin user reset', user: { email: user.email, role: user.role } });
    }
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/v1', apiRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
