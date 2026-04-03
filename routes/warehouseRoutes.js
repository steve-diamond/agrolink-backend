const express = require('express');
const { protect, authorize } = require('../middleware/auth.middleware');
const {
	createWarehouse,
	listWarehouses,
	bookWarehouseStorage,
	getMyStorageRecords,
	releaseStorage,
} = require('../controllers/warehouseController');

const router = express.Router();

router.get('/', listWarehouses);
router.post('/', protect, authorize('admin'), createWarehouse);
router.post('/bookings', protect, authorize('farmer', 'admin'), bookWarehouseStorage);
router.get('/bookings/me', protect, getMyStorageRecords);
router.patch('/bookings/:id/release', protect, releaseStorage);

module.exports = router;
