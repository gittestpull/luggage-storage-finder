import mongoose, { Schema, Document } from 'mongoose';

export interface IFortuneRanking extends Document {
  name: string;
  tier: number; // 1 to 10
  prizeName: string;
  probability: string; // e.g., "1/1000"
  createdAt: Date;
}

const FortuneRankingSchema = new Schema<IFortuneRanking>({
  name: { type: String, required: true },
  tier: { type: Number, required: true, index: true },
  prizeName: { type: String, required: true },
  probability: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, index: true },
});

// Prevent model recompilation error in development
const FortuneRanking = mongoose.models.FortuneRanking || mongoose.model<IFortuneRanking>('FortuneRanking', FortuneRankingSchema);

export default FortuneRanking;
