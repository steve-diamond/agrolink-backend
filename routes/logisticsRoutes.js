const express = require('express');
const { protect, authorize } = require('../middleware/auth.middleware');
const {
	createLogisticsRequest,
	getMyLogisticsRequests,
	getLogisticsRequestById,
	assignDriver,
	updateLogisticsStatus,
} = require('../controllers/logisticsController');

const router = express.Router();

router.use(protect);
router.post('/', authorize('buyer', 'farmer', 'admin'), createLogisticsRequest);
router.get('/me', getMyLogisticsRequests);
router.get('/:id', getLogisticsRequestById);
router.patch('/:id/assign', authorize('admin'), assignDriver);
router.patch('/:id/status', authorize('admin', 'farmer'), updateLogisticsStatus);

module.exports = router;
