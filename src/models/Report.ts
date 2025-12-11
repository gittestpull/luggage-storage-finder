import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IReport extends Document {
    storageId?: mongoose.Types.ObjectId;
    storageName?: string;
    name: string;
    address: string;
    location?: { type: 'Point'; coordinates: [number, number] };
    openTime?: string;
    closeTime?: string;
    is24Hours?: boolean;
    smallPrice?: number;
    largePrice?: number;
    phoneNumber?: string;
    description?: string;
    reportStatus: 'pending' | 'approved' | 'rejected';
    reportedBy?: mongoose.Types.ObjectId;
    createdAt: Date;
}

const reportSchema = new Schema<IReport>({
    storageId: { type: Schema.Types.ObjectId, ref: 'Storage', required: false },
    storageName: { type: String, required: false },
    name: { type: String, required: true },
    address: { type: String, required: true },
    location: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], required: false },
    },
    openTime: String,
    closeTime: String,
    is24Hours: Boolean,
    smallPrice: Number,
    largePrice: Number,
    phoneNumber: String,
    description: String,
    reportStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    reportedBy: { type: Schema.Types.ObjectId, ref: 'User', required: false },
    createdAt: { type: Date, default: Date.now },
});

export const Report: Model<IReport> =
    mongoose.models.Report || mongoose.model<IReport>('Report', reportSchema);

export default Report;
