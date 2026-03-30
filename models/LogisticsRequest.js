const mongoose = require('mongoose');

const LogisticsRequestSchema = new mongoose.Schema({
	order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
	status: { type: String, enum: ['pending', 'assigned', 'completed'], default: 'pending' },
	assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
	requestedAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('LogisticsRequest', LogisticsRequestSchema);
