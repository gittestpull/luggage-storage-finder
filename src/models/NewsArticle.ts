import mongoose, { Schema, Document, Model } from 'mongoose';

export interface INewsArticle extends Document {
    title: string;
    description: string;
    url: string;
    imageUrl?: string;
    publishedAt: Date;
    source: { name?: string };
    category: 'travel' | 'entertainment' | 'local';
    locations: Array<{ name: string; lat?: number; lng?: number }>;
}

const newsArticleSchema = new Schema<INewsArticle>({
    title: { type: String, required: true },
    description: { type: String, required: true },
    url: { type: String, required: true, unique: true },
    imageUrl: { type: String },
    publishedAt: { type: Date, required: true },
    source: { name: String },
    category: { type: String, enum: ['travel', 'entertainment', 'local'], required: true },
    locations: [{ name: String, lat: Number, lng: Number }],
});

export const NewsArticle: Model<INewsArticle> =
    mongoose.models.NewsArticle || mongoose.model<INewsArticle>('NewsArticle', newsArticleSchema);
