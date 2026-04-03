const mongoose = require('mongoose');

const WarehouseSchema = new mongoose.Schema({
	name: { type: String, required: true },
	location: { type: String, required: true },
	capacity: { type: Number, min: 0, required: true },
	availableCapacity: { type: Number, min: 0, required: true },
	supportsColdStorage: { type: Boolean, default: false },
	manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

WarehouseSchema.index({ location: 1, supportsColdStorage: 1 });
WarehouseSchema.index({ availableCapacity: -1 });

module.exports = mongoose.model('Warehouse', WarehouseSchema);
