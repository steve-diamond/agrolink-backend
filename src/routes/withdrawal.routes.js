const express = require('express');
const { protect, authorize } = require('../middleware/auth.middleware');
const {
  requestWithdrawal,
  listWithdrawals,
  updateWithdrawalStatus,
  adminApproveWithdrawal,
  adminMarkPaid,
  adminRefund,
  adminAddNote,
} = require('../controllers/withdrawal.controller');

const router = express.Router();


router.post('/request', protect, requestWithdrawal);
router.get('/admin', protect, authorize('admin'), listWithdrawals);
router.patch('/admin/:id/approve', protect, authorize('admin'), adminApproveWithdrawal);
router.patch('/admin/:id/mark-paid', protect, authorize('admin'), adminMarkPaid);
router.patch('/admin/:id/refund', protect, authorize('admin'), adminRefund);
router.patch('/admin/:id/note', protect, authorize('admin'), adminAddNote);

module.exports = router;
