const jwt = require('jsonwebtoken');

const User = require('../models/User');
const asyncHandler = require('../../../src/utils/asyncHandler');
const ApiError = require('../../utils/apiError');

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

module.exports = {
  register,
  login,
  getMe,
};
