import { NextRequest, NextResponse } from 'next/server';
import { Game } from '@/models';
import connectDB from '@/lib/db';

export async function GET(req: NextRequest) {
    try {
        await connectDB();
        let games = await Game.find({}).select('gameId name isPaid cost description');

        // Check and Seed Default Games
        const seed = [
            { gameId: 'jump', name: '짐프 (JUMP)', description: '짐가방 점프 게임', isPaid: true, cost: 10 },
            { gameId: 'shooting', name: '비행기 슈팅', description: '비행기 슈팅 게임', isPaid: true, cost: 10 },
            { gameId: 'fortune', name: '운세 가챠', description: '오늘의 운세 뽑기', isPaid: false, cost: 0 },
            { gameId: 'nightmare', name: '100 Days Nightmare', description: '좀비 서바이벌', isPaid: true, cost: 50 },
            { gameId: 'farming', name: '지갑 농장', description: '식물을 키워 부자가 되어보세요!\n전설의 황금나무를 심는 그날까지!', isPaid: false, cost: 0 },
            { gameId: 'bag-tetris', name: 'Sky Packer (스카이 패커)', description: '화물칸에 짐을 완벽하게 적재하세요!', isPaid: true, cost: 20 }
        ];

        for (const game of seed) {
            const exists = await Game.findOne({ gameId: game.gameId });
            if (!exists) {
                await Game.create(game);
            }
        }

        games = await Game.find({}).select('gameId name isPaid cost description');

        return NextResponse.json(games);
    } catch (error) {
        console.error('Fetch games error:', error);
        // Fallback for dev environment without DB
        if (process.env.NODE_ENV === 'development' || (error as any).code === 'ENOTFOUND') {
            const seed = [
                { gameId: 'jump', name: '짐프 (JUMP)', description: '짐가방 점프 게임', isPaid: true, cost: 10 },
                { gameId: 'shooting', name: '비행기 슈팅', description: '비행기 슈팅 게임', isPaid: true, cost: 10 },
                { gameId: 'fortune', name: '운세 가챠', description: '오늘의 운세 뽑기', isPaid: false, cost: 0 },
                { gameId: 'nightmare', name: '100 Days Nightmare', description: '좀비 서바이벌', isPaid: true, cost: 50 },
                { gameId: 'farming', name: '지갑 농장', description: '식물을 키워 부자가 되어보세요!\n전설의 황금나무를 심는 그날까지!', isPaid: false, cost: 0 },
                { gameId: 'bag-tetris', name: 'Sky Packer (스카이 패커)', description: '화물칸에 짐을 완벽하게 적재하세요!', isPaid: true, cost: 20 }
            ];
            return NextResponse.json(seed);
        }
        return NextResponse.json({ message: '서버 오류' }, { status: 500 });
    }
}
