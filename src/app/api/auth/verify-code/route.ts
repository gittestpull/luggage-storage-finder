import { NextRequest, NextResponse } from 'next/server';
import VerificationCode from '@/models/VerificationCode';
import connectDB from '@/lib/db';

export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const { email, code } = await req.json();

        const record = await VerificationCode.findOne({ email, code });
        if (!record) {
            return NextResponse.json(
                { message: '인증번호가 올바르지 않거나 만료되었습니다.' },
                { status: 400 }
            );
        }

        if (record.expiresAt < new Date()) {
            return NextResponse.json(
                { message: '인증번호가 만료되었습니다.' },
                { status: 400 }
            );
        }

        return NextResponse.json({ message: '인증 성공' });
    } catch (error) {
        console.error('Verify code error:', error);
        return NextResponse.json({ message: '서버 오류' }, { status: 500 });
    }
}
