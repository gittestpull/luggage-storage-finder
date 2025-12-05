import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '@/models/User';
import connectDB from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const { username, password } = await req.json();

        const user = await User.findOne({ username, isAdmin: true });
        if (!user) {
            return NextResponse.json({ message: '인증 실패' }, { status: 401 });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return NextResponse.json({ message: '인증 실패' }, { status: 401 });
        }

        const token = jwt.sign(
            { userId: user._id, isAdmin: user.isAdmin },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        return NextResponse.json({ token });
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ message: '서버 오류' }, { status: 500 });
    }
}
