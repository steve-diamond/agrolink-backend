const mongoose = require('mongoose');

const InventorySchema = new mongoose.Schema({
	product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
	quantity: { type: Number, required: true },
	warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
}, { timestamps: true });

module.exports = mongoose.model('Inventory', InventorySchema);
