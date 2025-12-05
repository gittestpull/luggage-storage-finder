import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import User from '@/models/User';
import VerificationCode from '@/models/VerificationCode';
import connectDB from '@/lib/db';

export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const { email, code, newPassword } = await req.json();

        // Verify code again to be safe
        const record = await VerificationCode.findOne({ email, code });
        if (!record || record.expiresAt < new Date()) {
            return NextResponse.json(
                { message: '인증번호가 유효하지 않습니다.' },
                { status: 400 }
            );
        }

        const user = await User.findOne({ username: email });
        if (!user) {
            return NextResponse.json(
                { message: '사용자를 찾을 수 없습니다.' },
                { status: 404 }
            );
        }

        // Update password (hashing is handled by pre-save hook in User model, but let's check)
        // Looking at User.js:
        // userSchema.pre('save', async function(next) {
        //     if (!this.isModified('password')) return next();
        //     this.password = await bcrypt.hash(this.password, await bcrypt.genSalt(10));
        //     next();
        // });
        // So we just set the password and save.

        user.password = newPassword;
        await user.save();

        // Delete verification code
        await VerificationCode.deleteOne({ _id: record._id });

        return NextResponse.json({ message: '비밀번호가 성공적으로 변경되었습니다.' });
    } catch (error) {
        console.error('Reset password error:', error);
        return NextResponse.json({ message: '서버 오류' }, { status: 500 });
    }
}
