const mongoose = require('mongoose');

const InventorySchema = new mongoose.Schema({
	product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
	owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
	commodityName: { type: String, trim: true, required: true },
	quantity: { type: Number, required: true },
	unit: { type: String, trim: true, default: 'kg' },
	qualityGrade: { type: String, trim: true, default: '' },
	warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
	storedAt: { type: Date, default: Date.now },
	storedUntil: { type: Date },
	warehouseReceipt: { type: String, unique: true, sparse: true },
}, { timestamps: true });

module.exports = mongoose.model('Inventory', InventorySchema);
