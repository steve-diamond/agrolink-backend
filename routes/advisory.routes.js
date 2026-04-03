const express = require('express');
const { getAdvisories, getAdvisoryFeed } = require('../controllers/advisory.controller');

const router = express.Router();

router.get('/', getAdvisories);
router.get('/feed', getAdvisoryFeed);

module.exports = router;
