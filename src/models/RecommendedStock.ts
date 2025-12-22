import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IRecommendedStock extends Document {
    name: string;
    code: string;
    description: string;
    imageUrl?: string;
    additionalInfo?: {
        creditTrend?: string;
        shortSellTrend?: string;
        [key: string]: any;
    };
    createdAt: Date;
}

const recommendedStockSchema = new Schema<IRecommendedStock>({
    name: { type: String, required: true },
    code: { type: String, required: true },
    description: { type: String, required: true },
    imageUrl: { type: String },
    additionalInfo: {
        creditTrend: String,
        shortSellTrend: String
    },
    createdAt: { type: Date, default: Date.now }
});

export const RecommendedStock: Model<IRecommendedStock> =
    mongoose.models.RecommendedStock || mongoose.model<IRecommendedStock>('RecommendedStock', recommendedStockSchema);
