import { NextRequest, NextResponse } from 'next/server';
import User from '@/models/User';
import VerificationCode from '@/models/VerificationCode';
import { sendVerificationEmail } from '@/lib/email';
import connectDB from '@/lib/db';

export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const { email } = await req.json();

        const user = await User.findOne({ username: email });
        if (!user) {
            return NextResponse.json(
                { message: '해당 이메일로 가입된 사용자가 없습니다.' },
                { status: 404 }
            );
        }

        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

        // Delete existing code for this email
        await VerificationCode.deleteMany({ email });

        await VerificationCode.create({
            email,
            code,
            expiresAt,
        });

        try {
            await sendVerificationEmail(email, code);
        } catch (emailError) {
            console.error('Email send error:', emailError);
            return NextResponse.json(
                { message: '이메일 전송 중 오류가 발생했습니다. 서버 설정을 확인해주세요.' },
                { status: 500 }
            );
        }

        return NextResponse.json({ message: '인증번호가 전송되었습니다.' });
    } catch (error) {
        console.error('Forgot password error:', error);
        return NextResponse.json({ message: '서버 오류' }, { status: 500 });
    }
}
