const path = require('path');
const crypto = require('crypto');
const Warehouse = require(path.join(__dirname, '..', 'models', 'Warehouse'));
const Inventory = require(path.join(__dirname, '..', 'models', 'Inventory'));
const asyncHandler = require(path.join(__dirname, '..', 'utils', 'asyncHandler'));
const ApiError = require(path.join(__dirname, '..', 'utils', 'apiError'));

const createWarehouse = asyncHandler(async (req, res) => {
	const { name, location, capacity, supportsColdStorage, manager } = req.body;

	if (!name || !capacity) {
		throw new ApiError(400, 'name and capacity are required.');
	}

	const warehouse = await Warehouse.create({
		name: String(name).trim(),
		location: location ? String(location).trim() : 'Unspecified location',
		capacity: Number(capacity),
		availableCapacity: Number(capacity),
		supportsColdStorage: Boolean(supportsColdStorage),
		manager,
	});

	res.status(201).json({ status: 'success', data: { warehouse } });
});

const listWarehouses = asyncHandler(async (_req, res) => {
	const items = await Warehouse.find().sort({ createdAt: -1 });
	res.status(200).json({ status: 'success', data: { items } });
});

const bookWarehouseStorage = asyncHandler(async (req, res) => {
	const {
		warehouseId,
		commodityName,
		quantity,
		unit,
		qualityGrade,
		storedUntil,
		product,
	} = req.body;

	if (!warehouseId || !commodityName || quantity === undefined) {
		throw new ApiError(400, 'warehouseId, commodityName and quantity are required.');
	}

	const qty = Number(quantity);
	if (!Number.isFinite(qty) || qty <= 0) {
		throw new ApiError(400, 'quantity must be a positive number.');
	}

	const warehouse = await Warehouse.findById(warehouseId);
	if (!warehouse) {
		throw new ApiError(404, 'Warehouse not found.');
	}

	if (qty > warehouse.availableCapacity) {
		throw new ApiError(400, 'Warehouse does not have enough capacity for this booking.');
	}

	const warehouseReceipt = `WR-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

	const record = await Inventory.create({
		product,
		owner: req.user._id,
		commodityName: String(commodityName).trim(),
		quantity: qty,
		unit: unit ? String(unit).trim() : 'kg',
		qualityGrade: qualityGrade ? String(qualityGrade).trim() : '',
		warehouse: warehouse._id,
		storedUntil: storedUntil ? new Date(storedUntil) : undefined,
		warehouseReceipt,
	});

	warehouse.availableCapacity = Math.max(0, warehouse.availableCapacity - qty);
	await warehouse.save();

	res.status(201).json({
		status: 'success',
		message: 'Warehouse booking created successfully.',
		data: { record },
	});
});

const getMyStorageRecords = asyncHandler(async (req, res) => {
	const items = await Inventory.find({ owner: req.user._id })
		.populate('warehouse', 'name location capacity availableCapacity supportsColdStorage')
		.sort('-createdAt');

	res.status(200).json({ status: 'success', data: { items } });
});

const releaseStorage = asyncHandler(async (req, res) => {
	const record = await Inventory.findById(req.params.id);
	if (!record) {
		throw new ApiError(404, 'Storage record not found.');
	}

	const isOwner = String(record.owner) === String(req.user._id);
	if (!isOwner && req.user.role !== 'admin') {
		throw new ApiError(403, 'You do not have permission to release this storage record.');
	}

	const warehouse = await Warehouse.findById(record.warehouse);
	if (warehouse) {
		warehouse.availableCapacity = Math.min(
			warehouse.capacity,
			warehouse.availableCapacity + record.quantity,
		);
		await warehouse.save();
	}

	await record.deleteOne();

	res.status(200).json({
		status: 'success',
		message: 'Storage record released successfully.',
	});
});

module.exports = {
	createWarehouse,
	listWarehouses,
	bookWarehouseStorage,
	getMyStorageRecords,
	releaseStorage,
};
