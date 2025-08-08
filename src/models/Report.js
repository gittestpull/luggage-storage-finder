const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    storageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Storage', required: false }, // 기존 짐보관소 ID
    storageName: { type: String, required: false }, // 기존 짐보관소 이름
    name: { type: String, required: true }, // 제보된 짐보관소 이름 (새로운 제보용)
    address: { type: String, required: true }, // 제보된 짐보관소 주소 (새로운 제보용)
    location: { type: { type: String, enum: ['Point'], default: 'Point' }, coordinates: { type: [Number], required: false } }, // 새로운 제보용, 필수는 아님
    openTime: String,
    closeTime: String,
    is24Hours: Boolean,
    smallPrice: Number,
    largePrice: Number,
    description: String,
    reportStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Report', reportSchema);
