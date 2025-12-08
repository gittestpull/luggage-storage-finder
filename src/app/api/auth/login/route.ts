import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { User } from '@/models';
import jwt from 'jsonwebtoken';

export async function POST(request: Request) {
    try {
        await dbConnect();
        const { username, password } = await request.json();

        const user = await User.findOne({ username });
        if (!user || !(await user.comparePassword(password))) {
            return NextResponse.json({ message: '인증 실패' }, { status: 401 });
        }

        const token = jwt.sign({ userId: user._id, isAdmin: user.isAdmin }, process.env.JWT_SECRET!, { expiresIn: '1h' });

        return NextResponse.json({
            token,
            user: {
                id: user._id,
                username: user.username,
                isAdmin: user.isAdmin,
                points: user.points,
                submittedReportPoints: user.submittedReportPoints,
                approvedReportPoints: user.approvedReportPoints,
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ message: '서버 오류' }, { status: 500 });
    }
}
