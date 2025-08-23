const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isAdmin: { type: Boolean, default: false },
    points: { type: Number, default: 0 }, // 총 포인트
    submittedReportPoints: { type: Number, default: 0 }, // 제보 점수
    approvedReportPoints: { type: Number, default: 0 } // 승인 점수
});

userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, await bcrypt.genSalt(10));
    next();
});

module.exports = mongoose.model('User', userSchema);
