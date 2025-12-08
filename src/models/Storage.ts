import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IStorageLocation {
    type: 'Point';
    coordinates: [number, number];
}

export interface IStorage extends Document {
    name: string;
    address: string;
    location: IStorageLocation;
    openTime?: string;
    closeTime?: string;
    is24Hours?: boolean;
    isPremium: boolean;
    smallPrice?: number;
    largePrice?: number;
    lockerCounts?: string;
    phoneNumber?: string;
    dataStandardDate?: string;
    status: { isOpen: boolean; lastUpdated: Date };
    createdAt: Date;
    report?: mongoose.Types.ObjectId;
}

const storageSchema = new Schema<IStorage>({
    name: { type: String, required: true },
    address: { type: String, required: true },
    location: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], required: true },
    },
    openTime: String,
    closeTime: String,
    is24Hours: Boolean,
    isPremium: { type: Boolean, default: false },
    smallPrice: Number,
    largePrice: Number,
    lockerCounts: String,
    phoneNumber: String,
    dataStandardDate: String,
    status: {
        isOpen: { type: Boolean, default: true },
        lastUpdated: { type: Date, default: Date.now },
    },
    createdAt: { type: Date, default: Date.now },
    report: { type: Schema.Types.ObjectId, ref: 'Report', required: false },
});

storageSchema.index({ location: '2dsphere' });

export const Storage: Model<IStorage> =
    mongoose.models.Storage || mongoose.model<IStorage>('Storage', storageSchema);

export default Storage;
