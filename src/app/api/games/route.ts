import { NextRequest, NextResponse } from 'next/server';
import { Game } from '@/models';
import connectDB from '@/lib/db';

export async function GET(req: NextRequest) {
    try {
        await connectDB();
        let games = await Game.find({}).select('gameId name isPaid cost description');

        // Fallback Seed (ensure frontend always gets data even if admin didn't visit yet)
        if (games.length === 0) {
            const seed = [
                { gameId: 'jump', name: '짐프 (JUMP)', description: '짐가방 점프 게임', isPaid: true, cost: 10 },
                { gameId: 'shooting', name: '비행기 슈팅', description: '비행기 슈팅 게임', isPaid: true, cost: 10 }
            ];
            await Game.insertMany(seed);
            games = await Game.find({}).select('gameId name isPaid cost description');
        }

        return NextResponse.json(games);
    } catch (error) {
        console.error('Fetch games error:', error);
        return NextResponse.json({ message: '서버 오류' }, { status: 500 });
    }
}
