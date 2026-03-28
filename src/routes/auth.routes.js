const express = require('express');
const { register, login, getMe } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');
const { body, validate } = require('../../middleware/validation');

const router = express.Router();

router.post('/register',
	body('name').isString().trim().notEmpty(),
	body('email').isEmail().normalizeEmail(),
	body('password').isString().isLength({ min: 6 }),
	body('role').optional().isIn(['farmer', 'buyer']),
	validate,
	register
);
router.post('/login',
	body('email').isEmail().normalizeEmail(),
	body('password').isString().notEmpty(),
	validate,
	login
);
router.get('/me', protect, getMe);

module.exports = router;
