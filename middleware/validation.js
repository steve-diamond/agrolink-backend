const { body, param, query, validationResult } = require('express-validator');

// Middleware to check validation results
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ status: 'error', errors: errors.array() });
  }
  next();
}

module.exports = {
  body,
  param,
  query,
  validate,
};
