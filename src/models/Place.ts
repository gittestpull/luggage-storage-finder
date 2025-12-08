import mongoose, { Schema, Document, Model } from 'mongoose';
import { IUser } from './User';

export interface IReview extends Document {
  user: IUser['_id'];
  text: string;
  photo?: string;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  photo: { type: String },
}, {
  timestamps: true,
});

export interface ITip extends Document {
  user: IUser['_id'];
  text: string;
  createdAt: Date;
}

const tipSchema = new Schema<ITip>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
}, {
  timestamps: true,
});

export interface IRating {
  location: number;
  taste: number;
  price: number;
  service: number;
  atmosphere: number;
}

export interface IPlace extends Document {
  name: string;
  address: string;
  description: string;
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  photos: string[];
  tips: ITip[];
  reviews: IReview[];
  rating: IRating;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

const placeSchema = new Schema<IPlace>({
  name: { type: String, required: true },
  address: { type: String, required: true },
  description: { type: String, required: true },
  location: {
    type: { type: String, enum: ['Point'], required: true },
    coordinates: { type: [Number], required: true },
  },
  photos: [{ type: String }],
  tips: [tipSchema],
  reviews: [reviewSchema],
  rating: {
    location: { type: Number, default: 0 },
    taste: { type: Number, default: 0 },
    price: { type: Number, default: 0 },
    service: { type: Number, default: 0 },
    atmosphere: { type: Number, default: 0 },
  },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
}, {
  timestamps: true,
});

placeSchema.index({ location: '2dsphere' });
placeSchema.index({ status: 1, createdAt: -1 });

export const Place: Model<IPlace> =
  mongoose.models.Place || mongoose.model<IPlace>('Place', placeSchema);

export default Place;
