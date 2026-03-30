const mongoose = require('mongoose');

const WarehouseSchema = new mongoose.Schema({
	name: { type: String, required: true },
	location: { type: String },
	capacity: { type: Number },
}, { timestamps: true });

module.exports = mongoose.model('Warehouse', WarehouseSchema);
