const express = require('express');
const { protect, authorize } = require('../middleware/auth.middleware');
const {
	createLoanApplication,
	getMyLoans,
	getAllLoans,
	reviewLoanApplication,
	markLoanRepaid,
} = require('../controllers/loanController');

const router = express.Router();

router.use(protect);
router.post('/', authorize('farmer', 'admin'), createLoanApplication);
router.get('/me', getMyLoans);
router.get('/', authorize('admin'), getAllLoans);
router.patch('/:id/review', authorize('admin'), reviewLoanApplication);
router.patch('/:id/repay', authorize('admin'), markLoanRepaid);

module.exports = router;
