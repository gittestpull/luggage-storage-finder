const mongoose = require('mongoose');

const storageSchema = new mongoose.Schema({
    name: { type: String, required: true },
    address: { type: String, required: true },
    location: { type: { type: String, enum: ['Point'], default: 'Point' }, coordinates: { type: [Number], required: true } },
    openTime: String,
    closeTime: String,
    is24Hours: Boolean,
    isPremium: { type: Boolean, default: false },
    smallPrice: Number,
    largePrice: Number,
    status: { isOpen: { type: Boolean, default: true }, lastUpdated: { type: Date, default: Date.now } },
    createdAt: { type: Date, default: Date.now },
    report: { type: mongoose.Schema.Types.ObjectId, ref: 'Report', required: false } // 제보 ID 추가
});
storageSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Storage', storageSchema);
