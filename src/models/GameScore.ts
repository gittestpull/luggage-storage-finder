import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IGameScore extends Document {
    userId: mongoose.Types.ObjectId;
    gameId: string;
    score: number;
    time: number; // in seconds
    createdAt: Date;
    updatedAt: Date;
}

const gameScoreSchema = new Schema<IGameScore>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        gameId: { type: String, required: true },
        score: { type: Number, required: true },
        time: { type: Number, required: true },
    },
    {
        timestamps: true,
    }
);

// Compound index to quickly find user's score for a specific game
// We strictly want one record per user per game (the best one)
gameScoreSchema.index({ userId: 1, gameId: 1 }, { unique: true });

export const GameScore: Model<IGameScore> = mongoose.models.GameScore || mongoose.model<IGameScore>('GameScore', gameScoreSchema);

export default GameScore;
