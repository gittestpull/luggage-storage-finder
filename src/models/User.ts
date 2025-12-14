import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
    username: string;
    password: string;
    isAdmin: boolean;
    points: number; // Current balance (can be spent)
    submittedReportPoints: number; // Lifetime accumulation (stats)
    approvedReportPoints: number; // Lifetime accumulation (stats)
    createdAt: Date;
    updatedAt: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
    deductPoints(amount: number): Promise<boolean>;
}

const userSchema = new Schema<IUser>({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isAdmin: { type: Boolean, default: false },
    points: { type: Number, default: 0 },
    submittedReportPoints: { type: Number, default: 0 },
    approvedReportPoints: { type: Number, default: 0 },
}, {
    timestamps: true,
});

userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
};

// Method to safely deduct points
userSchema.methods.deductPoints = async function (amount: number): Promise<boolean> {
    if (this.points >= amount) {
        this.points -= amount;
        await this.save();
        return true;
    }
    return false;
};

export const User: Model<IUser> =
    mongoose.models.User || mongoose.model<IUser>('User', userSchema);

export default User;
