const express = require('express');

const authRoutes = require('./auth.routes');
const productRoutes = require('./productRoutes');
const orderRoutes = require('./order.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/orders', orderRoutes);

module.exports = router;
