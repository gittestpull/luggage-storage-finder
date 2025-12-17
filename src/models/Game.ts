import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IGame extends Document {
    gameId: string;
    name: string;
    description: string;
    isPaid: boolean;
    cost: number;
    createdAt: Date;
    updatedAt: Date;
}

const gameSchema = new Schema<IGame>({
    gameId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String },
    isPaid: { type: Boolean, default: true },
    cost: { type: Number, default: 10 },
}, {
    timestamps: true,
});

export const Game: Model<IGame> = mongoose.models.Game || mongoose.model<IGame>('Game', gameSchema);

export default Game;
