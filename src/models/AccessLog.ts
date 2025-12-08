import mongoose from 'mongoose';

const accessLogSchema = new mongoose.Schema({
    path: { type: String, required: true },
    ip: { type: String },
    userAgent: { type: String },
    referer: { type: String },
    method: { type: String },
    timestamp: { type: Date, default: Date.now },
});

export default mongoose.models.AccessLog ||
    mongoose.model('AccessLog', accessLogSchema);
