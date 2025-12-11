import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import User from '@/models/User';
import { Game } from '@/models';
import connectDB from '@/lib/db';

export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const { gameId } = await req.json();

        // 1. Identify User
        const session = await verifyAuth(req);
        if (!session || !session.user) {
            return NextResponse.json({ message: '로그인이 필요합니다.' }, { status: 401 });
        }

        const userId = session.user.id;

        // 2. Get Game Config
        // If gameId is not provided, we can default to 'jump' or error out. 
        // For backwards compatibility or safety, let's assume if no gameId, fallback to 10 cost (but strict auth).
        let cost = 10;
        let isPaid = true;

        if (gameId) {
            const game = await Game.findOne({ gameId });
            if (game) {
                isPaid = game.isPaid;
                cost = game.cost;
            }
        }

        // If free, just return success (maybe log stats later)
        if (!isPaid) {
            return NextResponse.json({
                success: true,
                remainingPoints: 0, // Frontend should re-fetch user or we can return actual points if needed, but for free game it doesn't change.
                message: '무료 게임 시작!'
            });
        }

        // 3. Paid Logic
        const user = await User.findById(userId);
        if (!user) {
            return NextResponse.json({ message: '사용자를 찾을 수 없습니다.' }, { status: 404 });
        }

        if (user.points < cost) {
            return NextResponse.json({ message: '포인트가 부족합니다.' }, { status: 402 });
        }

        // Deduct points
        user.points -= cost;
        await user.save();

        return NextResponse.json({
            success: true,
            remainingPoints: user.points,
            message: `게임 시작! ${cost}포인트가 차감되었습니다.`
        });

    } catch (error) {
        console.error('Game start error:', error);
        return NextResponse.json({ message: '서버 오류' }, { status: 500 });
    }
}
