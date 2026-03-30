const mongoose = require('mongoose');

const FarmerSchema = new mongoose.Schema({
	name: { type: String, required: true },
	email: { type: String, required: true, unique: true },
	phone: { type: String },
	farms: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Farm' }],
}, { timestamps: true });

module.exports = mongoose.model('Farmer', FarmerSchema);
