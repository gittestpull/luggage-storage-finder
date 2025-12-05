import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPushSubscription extends Document {
    endpoint: string;
    expirationTime?: number;
    keys: { p256dh: string; auth: string };
    userId?: mongoose.Types.ObjectId;
    storageId?: mongoose.Types.ObjectId;
    createdAt: Date;
}

const pushSubscriptionSchema = new Schema<IPushSubscription>({
    endpoint: { type: String, required: true, unique: true },
    expirationTime: { type: Number, required: false },
    keys: { p256dh: { type: String, required: true }, auth: { type: String, required: true } },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: false },
    storageId: { type: Schema.Types.ObjectId, ref: 'Storage', required: false },
    createdAt: { type: Date, default: Date.now },
});

export const PushSubscription: Model<IPushSubscription> =
    mongoose.models.PushSubscription || mongoose.model<IPushSubscription>('PushSubscription', pushSubscriptionSchema);

export default PushSubscription;
