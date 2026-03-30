const mongoose = require('mongoose');

const CropSchema = new mongoose.Schema({
	name: { type: String, required: true },
	type: { type: String },
	farmer: { type: mongoose.Schema.Types.ObjectId, ref: 'Farmer' },
	plantedAt: { type: Date },
	harvested: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Crop', CropSchema);
