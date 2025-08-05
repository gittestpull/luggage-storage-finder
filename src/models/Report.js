const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    name: { type: String, required: true },
    address: { type: String, required: true },
    location: { type: { type: String, enum: ['Point'], default: 'Point' }, coordinates: { type: [Number], required: true } },
    openTime: String,
    closeTime: String,
    is24Hours: Boolean,
    smallPrice: Number,
    largePrice: Number,
    description: String,
    reportStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false }, // 제보자 ID 추가
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Report', reportSchema);
