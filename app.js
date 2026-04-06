const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimiter = require('./middleware/rateLimiter');
const morgan = require('morgan');
const { randomUUID } = require('crypto');
const {
  metricsMiddleware,
  metricsHandler,
  readinessHandler,
} = require('./middleware/observability.middleware');

const apiRoutes = require('./routes');
const adminRoutes = require('./routes/adminRoutes');
const authRoutes = require('./routes/authRoutes');
const orderRoutes = require('./routes/order.routes');
const paymentRoutes = require('./routes/paymentRoutes');
const productRoutes = require('./routes/productRoutes');
const farmerApplicationRoutes = require('./routes/farmerApplicationRoutes');
const buyerApplicationRoutes = require('./routes/buyerApplicationRoutes');
const onboardingRoutes = require('./routes/onboardingRoutes');
const { notFoundHandler, errorHandler } = require('./middleware/error.middleware');

const app = express();

const configuredOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim())
  : ['*'];


const corsOrigin = configuredOrigins.includes('*') ? true : configuredOrigins;
app.use(cors({ origin: corsOrigin }));
app.use(helmet());
app.use(compression());
app.use((req, res, next) => {
  req.requestId = req.headers['x-request-id'] || randomUUID();
  res.setHeader('x-request-id', req.requestId);
  next();
});
app.use(metricsMiddleware);
app.use(rateLimiter);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(
  morgan((tokens, req, res) => JSON.stringify({
    level: 'info',
    type: 'http_request',
    requestId: req.requestId,
    method: tokens.method(req, res),
    url: tokens.url(req, res),
    status: Number(tokens.status(req, res)),
    responseTimeMs: Number(tokens['response-time'](req, res)),
    contentLength: tokens.res(req, res, 'content-length') || 0,
    userAgent: tokens['user-agent'](req, res),
    remoteAddr: tokens['remote-addr'](req, res),
  }))
);

app.get('/', (req, res) => {
  res.send('AgroLink Backend is running...');
});

app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Agrolink API is healthy',
    timestamp: new Date().toISOString(),
  });
});

app.get('/ready', readinessHandler);
app.get('/metrics', metricsHandler);

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/farmer-applications', farmerApplicationRoutes);
app.use('/api/buyer-applications', buyerApplicationRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/v1', apiRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
