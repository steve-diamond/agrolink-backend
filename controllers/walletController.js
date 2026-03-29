const Wallet = require('../models/Wallet');
const WalletTransaction = require('../models/WalletTransaction');
const asyncHandler = require('./utils/asyncHandler');
const ApiError = require('./utils/apiError');

exports.getDepositHistory = asyncHandler(async (req, res) => {
	const txs = await WalletTransaction.find({ user: req.user._id, type: 'credit' }).sort('-createdAt');
	res.status(200).json({ status: 'success', data: txs });
});

exports.filterTransactions = asyncHandler(async (req, res) => {
	const { type, from, to } = req.query;
	const filter = { user: req.user._id };
	if (type) filter.type = type;
	if (from || to) filter.createdAt = {};
	if (from) filter.createdAt.$gte = new Date(from);
	if (to) filter.createdAt.$lte = new Date(to);
	const txs = await WalletTransaction.find(filter).sort('-createdAt');
	res.status(200).json({ status: 'success', data: txs });
});

exports.exportTransactions = asyncHandler(async (req, res) => {
	const txs = await WalletTransaction.find({ user: req.user._id });
	const csv = [
		'Date,Type,Amount,Reference,Description',
		...txs.map(tx => `${tx.createdAt.toISOString()},${tx.type},${tx.amount},${tx.reference || ''},${tx.description || ''}`)
	].join('\n');
	res.setHeader('Content-Type', 'text/csv');
	res.setHeader('Content-Disposition', 'attachment; filename=wallet_transactions.csv');
	res.send(csv);
});

exports.getWalletCurrency = asyncHandler(async (req, res) => {
	const wallet = await Wallet.findOne({ user: req.user._id });
	res.status(200).json({ status: 'success', currency: wallet ? wallet.currency : 'NGN' });
});

exports.lockWallet = asyncHandler(async (req, res) => {
	const { id } = req.params;
	const wallet = await Wallet.findById(id);
	if (!wallet) return res.status(404).json({ status: 'failed', message: 'Wallet not found' });
	wallet.locked = true;
	await wallet.save();
	res.status(200).json({ status: 'success', message: 'Wallet locked' });
});
exports.unlockWallet = asyncHandler(async (req, res) => {
	const { id } = req.params;
	const wallet = await Wallet.findById(id);
	if (!wallet) return res.status(404).json({ status: 'failed', message: 'Wallet not found' });
	wallet.locked = false;
	await wallet.save();
	res.status(200).json({ status: 'success', message: 'Wallet unlocked' });
});

exports.transferToUser = asyncHandler(async (req, res) => {
	const { toUserId, amount } = req.body;
	if (!toUserId || !amount || amount <= 0) return res.status(400).json({ status: 'failed', message: 'Invalid input' });
	const fromWallet = await Wallet.findOne({ user: req.user._id });
	if (!fromWallet || fromWallet.balance < amount) return res.status(400).json({ status: 'failed', message: 'Insufficient balance' });
	let toWallet = await Wallet.findOne({ user: toUserId });
	if (!toWallet) toWallet = await Wallet.create({ user: toUserId, balance: 0 });
	fromWallet.balance -= amount;
	toWallet.balance += amount;
	await fromWallet.save();
	await toWallet.save();
	await WalletTransaction.create({ user: req.user._id, type: 'debit', amount, description: `Transfer to user ${toUserId}` });
	await WalletTransaction.create({ user: toUserId, type: 'credit', amount, description: `Transfer from user ${req.user._id}` });
	res.status(200).json({ status: 'success', message: 'Transfer complete' });
});

exports.getWalletBalance = asyncHandler(async (req, res) => {
	const wallet = await Wallet.findOne({ user: req.user._id });
	res.status(200).json({
		status: 'success',
		balance: wallet ? wallet.balance : 0,
		currency: wallet ? wallet.currency : 'NGN',
	});
});

exports.getWalletTransactions = asyncHandler(async (req, res) => {
	const txs = await WalletTransaction.find({ user: req.user._id }).sort('-createdAt');
	res.status(200).json({ status: 'success', data: txs });
});

exports.requestWithdrawal = asyncHandler(async (req, res) => {
	const { amount } = req.body;
	if (!amount || amount <= 0) throw new ApiError(400, 'Invalid amount');
	const wallet = await Wallet.findOne({ user: req.user._id });
	if (!wallet || wallet.balance < amount) throw new ApiError(400, 'Insufficient balance');
	wallet.balance -= amount;
	await wallet.save();
	await WalletTransaction.create({
		user: req.user._id,
		type: 'debit',
		amount,
		description: 'Withdrawal',
	});
	res.status(200).json({ status: 'success', message: 'Withdrawal requested' });
});

exports.creditWallet = async function (userId, amount, reference, description) {
	let wallet = await Wallet.findOne({ user: userId });
	if (!wallet) wallet = await Wallet.create({ user: userId, balance: 0 });
	wallet.balance += amount;
	await wallet.save();
	const tx = await WalletTransaction.create({
		user: userId,
		type: 'credit',
		amount,
		reference,
		description,
	});
	wallet.transactions.push(tx._id);
	await wallet.save();
	return tx;
};
