const Delivery = require('../../models/Delivery');
const asyncHandler = require('../utils/asyncHandler');

exports.createDelivery = asyncHandler(async (req, res) => {
  const { order } = req.body;
  if (!order) return res.status(400).json({ status: 'failed', message: 'Order is required' });
  const delivery = await Delivery.create({ order });
  res.status(201).json({ status: 'success', data: delivery });
});

exports.getDelivery = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const delivery = await Delivery.findById(id).populate('order assignedTo');
  if (!delivery) return res.status(404).json({ status: 'failed', message: 'Not found' });
  res.status(200).json({ status: 'success', data: delivery });
});

exports.updateDeliveryStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, location } = req.body;
  const delivery = await Delivery.findById(id);
  if (!delivery) return res.status(404).json({ status: 'failed', message: 'Not found' });
  if (status) delivery.status = status;
  if (location) delivery.locationHistory.push({ location, status, timestamp: new Date() });
  await delivery.save();
  res.status(200).json({ status: 'success', data: delivery });
});

// Add more delivery actions as needed
