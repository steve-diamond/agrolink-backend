const mongoose = require('mongoose');

const LogisticsRequestSchema = new mongoose.Schema({
	order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
	requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
	farmer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
	buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
	pickupLocation: { type: String, required: true, trim: true },
	dropoffLocation: { type: String, required: true, trim: true },
	commodity: { type: String, required: true, trim: true },
	quantity: { type: Number, min: 1, required: true },
	unit: { type: String, trim: true, default: 'kg' },
	price: { type: Number, min: 0, default: 0 },
	status: {
		type: String,
		enum: ['pending', 'assigned', 'in_transit', 'delivered', 'cancelled'],
		default: 'pending',
	},
	assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
	vehicleNumber: { type: String, trim: true, default: '' },
	notes: { type: String, trim: true, default: '' },
	requestedAt: { type: Date, default: Date.now },
	pickedUpAt: { type: Date },
	deliveredAt: { type: Date },
}, { timestamps: true });

LogisticsRequestSchema.index({ farmer: 1, createdAt: -1 });
LogisticsRequestSchema.index({ buyer: 1, createdAt: -1 });
LogisticsRequestSchema.index({ assignedTo: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('LogisticsRequest', LogisticsRequestSchema);
