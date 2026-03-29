const express = require('express');


const authRoutes = require('../routes/auth.routes');
const productRoutes = require('../routes/productRoutes');
const orderRoutes = require('../routes/order.routes');
const subscriptionRoutes = require('../routes/subscription.routes');
const adminSubscriptionRoutes = require('../routes/admin.subscription.routes');
const walletRoutes = require('../routes/walletRoutes');
const withdrawalRoutes = require('../routes/withdrawal.routes');
const paymentRoutes = require('../routes/paymentRoutes');
// Delivery routes placeholder (to be implemented)

const router = express.Router();


router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/orders', orderRoutes);
router.use('/subscription', subscriptionRoutes);
router.use('/admin', adminSubscriptionRoutes);
router.use('/wallet', walletRoutes);
router.use('/payment', paymentRoutes);
router.use('/withdrawal', withdrawalRoutes);
const deliveryRoutes = require('../routes/delivery.routes');
router.use('/delivery', deliveryRoutes);

module.exports = router;
