const mongoose = require('mongoose');

const storageSchema = new mongoose.Schema({
    name: { type: String, required: true },
    address: { type: String, required: true },
    location: { type: { type: String, enum: ['Point'], default: 'Point' }, coordinates: { type: [Number], required: true } },
    openTime: String,
    closeTime: String,
    is24Hours: Boolean,
    smallPrice: Number,
    largePrice: Number,
    status: { isOpen: { type: Boolean, default: true }, lastUpdated: { type: Date, default: Date.now } },
    createdAt: { type: Date, default: Date.now }
});
storageSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Storage', storageSchema);
