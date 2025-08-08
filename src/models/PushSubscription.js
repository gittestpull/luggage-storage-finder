const mongoose = require('mongoose');

const PushSubscriptionSchema = new mongoose.Schema({
    endpoint: {
        type: String,
        required: true,
        unique: true,
    },
    expirationTime: {
        type: Number,
        required: false, // 구독 만료 시간 (선택 사항)
    },
    keys: {
        p256dh: {
            type: String,
            required: true,
        },
        auth: {
            type: String,
            required: true,
        },
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // User 모델과 연결 (선택 사항)
        required: false,
    },
    storageId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Storage', // Storage 모델과 연결 (선택 사항)
        required: false,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('PushSubscription', PushSubscriptionSchema);
