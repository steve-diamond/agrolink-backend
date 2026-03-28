const express = require('express');
const { protect } = require('../middleware/auth.middleware');
const {
  createDelivery,
  getDelivery,
  updateDeliveryStatus,
} = require('../controllers/delivery.controller');

const router = express.Router();

router.post('/', protect, createDelivery);
router.get('/:id', protect, getDelivery);
router.put('/:id', protect, updateDeliveryStatus);

module.exports = router;
