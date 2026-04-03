const path = require('path');
const LogisticsRequest = require(path.join(__dirname, '..', 'models', 'LogisticsRequest'));
const Order = require(path.join(__dirname, '..', 'models', 'Order'));
const asyncHandler = require(path.join(__dirname, '..', 'utils', 'asyncHandler'));
const ApiError = require(path.join(__dirname, '..', 'utils', 'apiError'));

const createLogisticsRequest = asyncHandler(async (req, res) => {
	const {
		orderId,
		pickupLocation,
		dropoffLocation,
		commodity,
		quantity,
		unit,
		price,
		notes,
	} = req.body;

	if (!orderId) {
		throw new ApiError(400, 'orderId is required.');
	}

	const order = await Order.findById(orderId).select('_id user status');
	if (!order) {
		throw new ApiError(404, 'Order not found.');
	}

	const request = await LogisticsRequest.create({
		order: order._id,
		requester: req.user._id,
		farmer: req.user._id,
		buyer: order.user,
		pickupLocation: pickupLocation || 'Farm pickup point',
		dropoffLocation: dropoffLocation || 'Buyer delivery point',
		commodity: commodity || 'Mixed produce',
		quantity: quantity !== undefined ? Number(quantity) : 1,
		unit: unit || 'kg',
		price: price !== undefined ? Number(price) : 0,
		notes: notes ? String(notes).trim() : '',
		status: 'pending',
	});

	res.status(201).json({
		status: 'success',
		message: 'Logistics request created.',
		data: { request },
	});
});

const getMyLogisticsRequests = asyncHandler(async (req, res) => {
	const requests = await LogisticsRequest.find({
		$or: [{ farmer: req.user._id }, { buyer: req.user._id }, { assignedTo: req.user._id }],
	})
		.populate('order', 'status totalAmount createdAt')
		.sort('-createdAt');

	res.status(200).json({ status: 'success', data: { items: requests } });
});

const getLogisticsRequestById = asyncHandler(async (req, res) => {
	const request = await LogisticsRequest.findById(req.params.id)
		.populate('order', 'status totalAmount createdAt')
		.populate('farmer', 'name email role')
		.populate('buyer', 'name email role')
		.populate('assignedTo', 'name email role');

	if (!request) {
		throw new ApiError(404, 'Logistics request not found.');
	}

	const canView =
		req.user.role === 'admin' ||
		String(request.farmer?._id || request.farmer) === String(req.user._id) ||
		String(request.buyer?._id || request.buyer) === String(req.user._id) ||
		String(request.assignedTo?._id || request.assignedTo) === String(req.user._id);

	if (!canView) {
		throw new ApiError(403, 'You do not have permission to view this logistics request.');
	}

	res.status(200).json({ status: 'success', data: { request } });
});

const assignDriver = asyncHandler(async (req, res) => {
	const { driverId } = req.body;
	const request = await LogisticsRequest.findById(req.params.id);

	if (!request) {
		throw new ApiError(404, 'Logistics request not found.');
	}

	if (!driverId) {
		throw new ApiError(400, 'driverId is required.');
	}

	request.assignedTo = driverId;
	request.status = 'assigned';
	request.notes = `${request.notes || ''}\nDriver assigned by admin (${req.user._id}).`.trim();
	await request.save();

	res.status(200).json({
		status: 'success',
		message: 'Driver assigned successfully.',
		data: { request },
	});
});

const updateLogisticsStatus = asyncHandler(async (req, res) => {
	const { status, note } = req.body;
	const request = await LogisticsRequest.findById(req.params.id);

	if (!request) {
		throw new ApiError(404, 'Logistics request not found.');
	}

	const allowedStatuses = ['pending', 'assigned', 'in_transit', 'delivered', 'cancelled'];
	if (!allowedStatuses.includes(status)) {
		throw new ApiError(400, `status must be one of: ${allowedStatuses.join(', ')}`);
	}

	request.status = status;
	request.notes = `${request.notes || ''}\n${note ? String(note).trim() : `Status updated to ${status}.`}`.trim();

	if (status === 'in_transit') {
		request.pickedUpAt = request.pickedUpAt || new Date();
	}

	if (status === 'delivered') {
		request.deliveredAt = new Date();
	}

	await request.save();

	res.status(200).json({
		status: 'success',
		message: 'Logistics status updated.',
		data: { request },
	});
});

module.exports = {
	createLogisticsRequest,
	getMyLogisticsRequests,
	getLogisticsRequestById,
	assignDriver,
	updateLogisticsStatus,
};
