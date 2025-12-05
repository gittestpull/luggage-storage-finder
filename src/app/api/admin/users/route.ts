import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/auth';
import User from '@/models/User';
import connectDB from '@/lib/db';

export async function GET(req: NextRequest) {
    const admin = await verifyAdmin(req);
    if (!admin) {
        return NextResponse.json({ message: '권한이 없습니다.' }, { status: 403 });
    }

    try {
        await connectDB();
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        return NextResponse.json(users);
    } catch (error) {
        console.error('Fetch users error:', error);
        return NextResponse.json({ message: '서버 오류' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const admin = await verifyAdmin(req);
    if (!admin) {
        return NextResponse.json({ message: '권한이 없습니다.' }, { status: 403 });
    }

    try {
        await connectDB();
        const { username, password, isAdmin, points } = await req.json();

        if (!username || !password) {
            return NextResponse.json(
                { message: '사용자 이름과 비밀번호는 필수입니다.' },
                { status: 400 }
            );
        }

        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return NextResponse.json(
                { message: '이미 존재하는 사용자 이름입니다.' },
                { status: 409 }
            );
        }

        const newUser = new User({
            username,
            password,
            isAdmin: isAdmin || false,
            points: points || 0,
        });

        await newUser.save();
        return NextResponse.json(
            { message: '사용자가 성공적으로 생성되었습니다.', user: newUser },
            { status: 201 }
        );
    } catch (error) {
        console.error('Create user error:', error);
        return NextResponse.json({ message: '서버 오류' }, { status: 500 });
    }
}
