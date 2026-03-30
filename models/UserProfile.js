const mongoose = require('mongoose');

const UserProfileSchema = new mongoose.Schema({
	user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
	bio: { type: String },
	avatar: { type: String },
	address: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('UserProfile', UserProfileSchema);
