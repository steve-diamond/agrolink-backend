const ApiError = require('../utils/apiError');

const notFoundHandler = (req, res, next) => {
  next(new ApiError(404, `Route not found: ${req.originalUrl}`));
};

const normalizeError = (error) => {
  if (error.name === 'CastError') {
    return new ApiError(400, `Invalid ${error.path}: ${error.value}`);
  }

  if (error.code === 11000) {
    const field = Object.keys(error.keyValue || {}).join(', ');
    return new ApiError(409, `Duplicate value for field(s): ${field}`);
  }

  if (error.name === 'ValidationError') {
    const details = Object.values(error.errors).map((item) => item.message);
    return new ApiError(400, 'Validation failed.', details);
  }

  return error;
};

const errorHandler = (error, req, res, next) => {
  const normalizedError = normalizeError(error);
  const statusCode = normalizedError.statusCode || 500;
  const isProduction = process.env.NODE_ENV === 'production';

  const response = {
    status: 'error',
    message: normalizedError.message || 'Internal Server Error',
  };

  if (normalizedError.details) {
    response.details = normalizedError.details;
  }

  if (!isProduction) {
    response.stack = normalizedError.stack;
  }

  res.status(statusCode).json(response);
};

module.exports = {
  notFoundHandler,
  errorHandler,
};
