import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { User } from '@/models/User';

export async function POST(request: Request) {
    try {
        await dbConnect();
        const { username, password } = await request.json();

        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return NextResponse.json({ message: '이미 존재하는 사용자입니다.' }, { status: 400 });
        }

        const user = new User({ username, password, isAdmin: false });
        await user.save();

        return NextResponse.json({ message: '회원가입 성공' }, { status: 201 });
    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json({ message: '서버 오류' }, { status: 500 });
    }
}
