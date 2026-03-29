
const asyncHandler = require('../../utils/asyncHandler');
const Withdrawal = require('../../models/Withdrawal');
const Wallet = require('../../models/Wallet');
const ApiError = require('../../utils/apiError');

// Admin: List all withdrawals
exports.listWithdrawals = asyncHandler(async (req, res) => {
  const withdrawals = await Withdrawal.find().sort('-createdAt');
  res.status(200).json({ status: 'success', data: withdrawals });
});

// 1. User requests withdrawal
exports.requestWithdrawal = asyncHandler(async (req, res) => {
  const { amount, bankDetails } = req.body;
  if (!amount || amount <= 0) throw new ApiError(400, 'Invalid amount');
  if (!bankDetails || !bankDetails.accountName || !bankDetails.accountNumber || !bankDetails.bankName) {
    throw new ApiError(400, 'Bank details are required');
  }
  const wallet = await Wallet.findOne({ user: req.user._id });
  if (!wallet || wallet.balance < amount) throw new ApiError(400, 'Insufficient balance');
  wallet.balance -= amount;
  await wallet.save();
  const withdrawal = await Withdrawal.create({
    user: req.user._id,
    amount,
    status: 'pending',
    bankDetails,
  });
  res.status(201).json({ status: 'success', data: withdrawal });
});

// 2. Get withdrawals for logged-in user
exports.getUserWithdrawals = asyncHandler(async (req, res) => {
  const withdrawals = await Withdrawal.find({ user: req.user._id }).sort('-createdAt');
  res.status(200).json({ status: 'success', data: withdrawals });
});


// 3. Admin approves withdrawal
exports.adminApproveWithdrawal = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const withdrawal = await Withdrawal.findById(id);
  if (!withdrawal) throw new ApiError(404, 'Withdrawal not found');
  withdrawal.status = 'approved';
  await withdrawal.save();
  res.status(200).json({ status: 'success', data: withdrawal });
});

// 4. Admin marks withdrawal as paid
exports.adminMarkPaid = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const withdrawal = await Withdrawal.findById(id);
  if (!withdrawal) throw new ApiError(404, 'Withdrawal not found');
  withdrawal.status = 'paid';
  await withdrawal.save();
  res.status(200).json({ status: 'success', data: withdrawal });
});

// 5. Admin refunds withdrawal
exports.adminRefund = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const withdrawal = await Withdrawal.findById(id);
  if (!withdrawal) throw new ApiError(404, 'Withdrawal not found');
  if (withdrawal.status === 'paid') throw new ApiError(400, 'Cannot refund a paid withdrawal');
  withdrawal.status = 'refunded';
  // Refund to wallet
  const wallet = await Wallet.findOne({ user: withdrawal.user });
  if (wallet) {
    wallet.balance += withdrawal.amount;
    await wallet.save();
  }
  await withdrawal.save();
  res.status(200).json({ status: 'success', data: withdrawal });
});

// 6. Admin adds a note/comment
exports.adminAddNote = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { note } = req.body;
  const withdrawal = await Withdrawal.findById(id);
  if (!withdrawal) throw new ApiError(404, 'Withdrawal not found');
  withdrawal.adminNote = note || '';
  await withdrawal.save();
  res.status(200).json({ status: 'success', data: withdrawal });
});
