const express = require('express');


const authRoutes = require('./auth.routes');
const productRoutes = require('./productRoutes');
const orderRoutes = require('./order.routes');
const subscriptionRoutes = require('./subscription.routes');
const adminSubscriptionRoutes = require('./admin.subscription.routes');
const walletRoutes = require('../../routes/walletRoutes');
const withdrawalRoutes = require('./withdrawal.routes');
const paymentRoutes = require('../../routes/paymentRoutes');
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
const deliveryRoutes = require('./delivery.routes');
router.use('/delivery', deliveryRoutes);

module.exports = router;
