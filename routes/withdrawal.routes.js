const express = require('express');
const path = require('path');
const { protect, authorize } = require(path.join(__dirname, '..', 'middleware', 'auth.middleware'));
const {
  requestWithdrawal,
  listWithdrawals,
  adminApproveWithdrawal,
  adminMarkPaid,
  adminRefund,
  adminAddNote,
} = require(path.join(__dirname, '..', 'controllers', 'withdrawal.controller'));
const { body, param, validate } = require(path.join(__dirname, '..', 'middleware', 'validation'));

const router = express.Router();

router.post('/request',
  protect,
  body('amount').isNumeric().toFloat().isFloat({ gt: 0 }),
  body('bankDetails').isObject(),
  body('bankDetails.accountName').isString().trim().notEmpty(),
  body('bankDetails.accountNumber').isString().trim().notEmpty(),
  body('bankDetails.bankName').isString().trim().notEmpty(),
  validate,
  requestWithdrawal
);
router.get('/admin', protect, authorize('admin'), listWithdrawals);
router.patch('/admin/:id/approve',
  protect,
  authorize('admin'),
  param('id').isMongoId(),
  validate,
  adminApproveWithdrawal
);
router.patch('/admin/:id/mark-paid',
  protect,
  authorize('admin'),
  param('id').isMongoId(),
  validate,
  adminMarkPaid
);
router.patch('/admin/:id/refund',
  protect,
  authorize('admin'),
  param('id').isMongoId(),
  validate,
  adminRefund
);
router.patch('/admin/:id/note',
  protect,
  authorize('admin'),
  param('id').isMongoId(),
  body('note').isString().trim().notEmpty(),
  validate,
  adminAddNote
);

module.exports = router;
