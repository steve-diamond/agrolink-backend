const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimiter = require('./middleware/rateLimiter');

const apiRoutes = require('../routes');
const adminRoutes = require('../routes/adminRoutes');
const authRoutes = require('../routes/authRoutes');
const orderRoutes = require('../routes/order.routes');
const paymentRoutes = require('../routes/paymentRoutes');
const productRoutes = require('../routes/productRoutes');
const { notFoundHandler, errorHandler } = require('../middleware/error.middleware');

const app = express();

const configuredOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim())
  : ['*'];


const corsOrigin = configuredOrigins.includes('*') ? true : configuredOrigins;
app.use(cors({ origin: corsOrigin }));
app.use(helmet());
app.use(rateLimiter);
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

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/v1', apiRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
