const express = require('express');
const { protect } = require('../middleware/auth.middleware');
const {
	getWalletBalance,
	getWalletTransactions,
	requestWithdrawal,
	getDepositHistory,
	filterTransactions,
	exportTransactions,
	getWalletCurrency,
	lockWallet,
	unlockWallet,
	transferToUser,
} = require('../controllers/wallet.controller');

const router = express.Router();



router.get('/me', protect, getWalletBalance);
router.get('/transactions', protect, getWalletTransactions);
router.get('/deposits', protect, getDepositHistory);
router.get('/filter', protect, filterTransactions);
router.get('/export', protect, exportTransactions);
router.get('/currency', protect, getWalletCurrency);
router.post('/withdraw', protect, requestWithdrawal);
router.post('/transfer', protect, transferToUser);
router.post('/lock/:id', protect, lockWallet); // admin should protect
router.post('/unlock/:id', protect, unlockWallet); // admin should protect

module.exports = router;
