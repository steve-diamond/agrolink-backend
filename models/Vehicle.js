const mongoose = require('mongoose');

const VehicleSchema = new mongoose.Schema({
	driver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
	plateNumber: { type: String, required: true },
	type: { type: String },
	capacity: { type: Number },
}, { timestamps: true });

module.exports = mongoose.model('Vehicle', VehicleSchema);
