const express = require('express');



const authRoutes = require('../routes/auth.routes');
const productRoutes = require('../routes/productRoutes');
const orderRoutes = require('../routes/order.routes');
const subscriptionRoutes = require('../routes/subscription.routes');
const adminSubscriptionRoutes = require('../routes/admin.subscription.routes');
const walletRoutes = require('../routes/walletRoutes');
const withdrawalRoutes = require('../routes/withdrawal.routes');
const paymentRoutes = require('../routes/paymentRoutes');
const loanRoutes = require('../routes/loanRoutes');
const logisticsRoutes = require('../routes/logisticsRoutes');
const warehouseRoutes = require('../routes/warehouseRoutes');
const intelligenceRoutes = require('../routes/intelligence.routes');
const advisoryRoutes = require('../routes/advisory.routes');
const userRoutes = require('../routes/user.routes');
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
router.use('/loans', loanRoutes);
router.use('/logistics', logisticsRoutes);
router.use('/warehouses', warehouseRoutes);
router.use('/intelligence', intelligenceRoutes);
router.use('/advisory', advisoryRoutes);
router.use('/users', userRoutes);
const deliveryRoutes = require('../routes/delivery.routes');
router.use('/delivery', deliveryRoutes);

module.exports = router;
