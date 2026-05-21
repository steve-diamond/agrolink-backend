const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const path = require('path');
const asyncHandler = require(path.join(__dirname, '..', 'utils', 'asyncHandler'));
const ApiError = require(path.join(__dirname, '..', 'utils', 'apiError'));

const getToken = (userId) => {
	if (!process.env.JWT_SECRET) {
		throw new ApiError(500, 'JWT_SECRET is not configured.');
	}
	return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
		expiresIn: process.env.JWT_EXPIRES_IN || '7d',
	});
};

const sanitizeUser = (userDoc) => {
	const user = userDoc.toObject();
	delete user.password;
	return user;
};

const register = asyncHandler(async (req, res) => {
	const { name, email, password, role } = req.body;
	if (!name || !email || !password) {
		throw new ApiError(400, 'Name, email, and password are required.');
	}
	if (role && !['farmer', 'buyer'].includes(role)) {
		throw new ApiError(400, 'Role must be either farmer or buyer.');
	}
	const existingUser = await User.findOne({ email });
	if (existingUser) {
		throw new ApiError(409, 'A user with this email already exists.');
	}
	const user = await User.create({
		name,
		email,
		password,
		role: role || 'buyer',
	});
	const token = getToken(user._id);
	res.status(201).json({
		status: 'success',
		data: {
			user: sanitizeUser(user),
			token,
		},
	});
});

const login = asyncHandler(async (req, res) => {
	const { email, password } = req.body;
	if (!email || !password) {
		throw new ApiError(400, 'Email and password are required.');
	}
	const user = await User.findOne({ email }).select('+password');
	if (!user || !(await user.comparePassword(password))) {
		throw new ApiError(401, 'Invalid credentials.');
	}
	const token = getToken(user._id);
	// Set secure cookie
	res.cookie('token', token, {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'strict',
		maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
	});
	res.status(200).json({
		status: 'success',
		data: {
			user: sanitizeUser(user),
			token,
		},
	});
});

const getMe = asyncHandler(async (req, res) => {
	const user = await User.findById(req.user._id).select('-password');
	res.status(200).json({
		status: 'success',
		data: {
			user,
		},
	});
});

const forgotPassword = asyncHandler(async (req, res) => {
	const { email } = req.body;
	if (!email) throw new ApiError(400, 'Email is required.');

	const user = await User.findOne({ email: String(email).toLowerCase().trim() })
		.select('+resetToken +resetTokenExpiry');

	// Always return success to prevent user enumeration
	if (!user) {
		return res.status(200).json({
			status: 'success',
			message: 'If that account exists, a reset token has been generated.',
		});
	}

	const resetToken = crypto.randomBytes(32).toString('hex');
	user.resetToken = resetToken;
	user.resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
	await user.save();

	res.status(200).json({
		status: 'success',
		message: 'Password reset token generated.',
		resetToken,
	});
});

const resetPassword = asyncHandler(async (req, res) => {
	const { token, password } = req.body;
	if (!token) throw new ApiError(400, 'Reset token is required.');
	if (!password || password.length < 8)
		throw new ApiError(400, 'Password must be at least 8 characters long.');

	const user = await User.findOne({ resetToken: token })
		.select('+resetToken +resetTokenExpiry +password');

	if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
		throw new ApiError(400, 'Reset token is invalid or has expired.');
	}

	user.password = password;
	user.resetToken = null;
	user.resetTokenExpiry = null;
	await user.save();

	res.status(200).json({
		status: 'success',
		message: 'Password has been reset successfully.',
	});
});

module.exports = {
	register,
	login,
	getMe,
	forgotPassword,
	resetPassword,
};
