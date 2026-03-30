const mongoose = require('mongoose');

const FarmSchema = new mongoose.Schema({
	name: { type: String, required: true },
	location: { type: String },
	size: { type: Number },
	owner: { type: mongoose.Schema.Types.ObjectId, ref: 'Farmer' },
}, { timestamps: true });

module.exports = mongoose.model('Farm', FarmSchema);
