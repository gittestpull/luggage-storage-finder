import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/auth';
import { Game } from '@/models';
import connectDB from '@/lib/db';

export async function GET(req: NextRequest) {
    const admin = await verifyAdmin(req);
    if (!admin) {
        return NextResponse.json({ message: '권한이 없습니다.' }, { status: 403 });
    }

    try {
        await connectDB();
        let games = await Game.find({});

        // Initial Seed if empty
        if (games.length === 0) {
            const seed = [
                { gameId: 'jump', name: '짐프 (JUMP)', description: '짐가방 점프 게임', isPaid: true, cost: 10 },
                { gameId: 'shooting', name: '비행기 슈팅', description: '비행기 슈팅 게임', isPaid: true, cost: 10 }
            ];
            await Game.insertMany(seed);
            games = await Game.find({});
        }

        return NextResponse.json(games);
    } catch (error) {
        console.error('Fetch games error:', error);
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
        const { gameId, isPaid, cost } = await req.json();

        const game = await Game.findOneAndUpdate(
            { gameId },
            { isPaid, cost },
            { new: true }
        );

        if (!game) {
            return NextResponse.json({ message: '게임을 찾을 수 없습니다.' }, { status: 404 });
        }

        return NextResponse.json({ message: '설정이 저장되었습니다.', game });
    } catch (error) {
        console.error('Update game error:', error);
        return NextResponse.json({ message: '서버 오류' }, { status: 500 });
    }
}
