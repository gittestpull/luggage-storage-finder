import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IRelatedStock {
    name: string;
    code: string;
    reason: string;
}

export interface INewsArticle extends Document {
    title: string;
    description: string;
    url: string;
    imageUrl?: string;
    publishedAt: Date;
    source: { name?: string };
    category: 'travel' | 'entertainment' | 'local' | 'restaurant';
    locations: Array<{ name: string; lat?: number; lng?: number }>;
    relatedStocks?: IRelatedStock[];
}

const newsArticleSchema = new Schema<INewsArticle>({
    title: { type: String, required: true },
    description: { type: String, required: true },
    url: { type: String, required: true, unique: true },
    imageUrl: { type: String },
    publishedAt: { type: Date, required: true },
    source: { name: String },
    category: { type: String, enum: ['travel', 'entertainment', 'local', 'restaurant'], required: true },
    locations: [{ name: String, lat: Number, lng: Number }],
    relatedStocks: [{
        name: String,
        code: String,
        reason: String
    }]
});

export const NewsArticle: Model<INewsArticle> =
    mongoose.models.NewsArticle || mongoose.model<INewsArticle>('NewsArticle', newsArticleSchema);
