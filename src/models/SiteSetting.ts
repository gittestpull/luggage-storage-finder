import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISiteSetting extends Document {
    key: string;
    value: any;
    updatedAt: Date;
}

const siteSettingSchema = new Schema<ISiteSetting>({
    key: { type: String, required: true, unique: true },
    value: { type: Schema.Types.Mixed, required: true },
}, {
    timestamps: true,
});

export const SiteSetting: Model<ISiteSetting> =
    mongoose.models.SiteSetting || mongoose.model<ISiteSetting>('SiteSetting', siteSettingSchema);

export default SiteSetting;
