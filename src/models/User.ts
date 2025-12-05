import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
    username: string;
    password: string;
    isAdmin: boolean;
    points: number;
    submittedReportPoints: number;
    approvedReportPoints: number;
    createdAt: Date;
    updatedAt: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
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

export const User: Model<IUser> =
    mongoose.models.User || mongoose.model<IUser>('User', userSchema);

export default User;
