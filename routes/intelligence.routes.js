const express = require('express');
const { getPriceIntelligence } = require('../controllers/priceIntelligence.controller');

const router = express.Router();

router.get('/prices', getPriceIntelligence);

module.exports = router;
