import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth'; // We need to check session
import User from '@/models/User';
import connectDB from '@/lib/db';

export async function POST(req: NextRequest) {
    try {
        await connectDB();

        // 1. Identify User
        // We can use session (verifyAuth) or accept username if we want to allow "Guest with Username" to play?
        // But for deducting points, we MUST strictly verify ownership. So Auth is required OR a secure way.
        // Given the "No Login" requirement was for *Reporting*, usually Games require Login to use points.
        // However, if the user isn't logged in but provided a username, anyone could drain their points.
        // So I will enforce strict Auth for deducting points.

        const session = await verifyAuth(req);
        if (!session || !session.user) {
             return NextResponse.json({ message: '로그인이 필요합니다.' }, { status: 401 });
        }

        const userId = session.user.id;
        const COST_TO_PLAY = 10;

        const user = await User.findById(userId);
        if (!user) {
            return NextResponse.json({ message: '사용자를 찾을 수 없습니다.' }, { status: 404 });
        }

        if (user.points < COST_TO_PLAY) {
            return NextResponse.json({ message: '포인트가 부족합니다.' }, { status: 402 });
        }

        // Deduct points
        user.points -= COST_TO_PLAY;
        await user.save();

        return NextResponse.json({
            success: true,
            remainingPoints: user.points,
            message: '게임 시작! 10포인트가 차감되었습니다.'
        });

    } catch (error) {
        console.error('Game start error:', error);
        return NextResponse.json({ message: '서버 오류' }, { status: 500 });
    }
}
