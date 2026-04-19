const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async (req, res, next) => {
	const token = req.cookies?.token || req.headers['authorization']?.replace('Bearer ', '');
	if (!token) {
		return res.status(401).json({ message: 'No authentication token provided.' });
	}
	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		const user = await User.findById(decoded.id);
		if (!user) {
			return res.status(401).json({ message: 'User not found.' });
		}
		req.user = user;
		next();
	} catch (err) {
		return res.status(401).json({ message: 'Invalid or expired token.' });
	}
};
