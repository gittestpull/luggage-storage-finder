import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { GameScore } from '@/models';
import connectDB from '@/lib/db';

export async function GET(req: NextRequest) {
    try {
        await connectDB();
        const session = await verifyAuth(req);
        // if (!session?.user) {
        //     return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        // }

        const { searchParams } = new URL(req.url);
        const gameId = searchParams.get('gameId');

        if (!gameId) {
            return NextResponse.json({ message: 'Missing gameId' }, { status: 400 });
        }

        let record = null;
        if (session?.user) {
            record = await GameScore.findOne({ userId: session.user.id, gameId });
        }

        // Fetch Global Best
        // Sort by Score DESC, then Time ASC
        const globalRecord = await GameScore.findOne({ gameId })
            .sort({ score: -1, time: 1 })
            .populate('userId', 'username');

        return NextResponse.json({
            authenticated: !!session?.user,
            personal: record ? {
                score: record.score,
                time: record.time,
                nickname: record.nickname
            } : null,
            global: globalRecord ? {
                score: globalRecord.score,
                time: globalRecord.time,
                userName: globalRecord.nickname || (globalRecord.userId as any)?.username || 'Unknown'
            } : null
        });

    } catch (error) {
        console.error('Get score error:', error);
        return NextResponse.json({ message: 'Server error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const session = await verifyAuth(req);
        // Remove strict auth check to allow anonymous scores

        const { gameId, score, time, nickname } = await req.json();

        if (!gameId || typeof score !== 'number' || typeof time !== 'number') {
            return NextResponse.json({ message: 'Invalid data' }, { status: 400 });
        }

        let saved = false;

        if (session?.user) {
            // Logged in user: Update their single record
            const existing = await GameScore.findOne({ userId: session.user.id, gameId });

            // Get username for default nickname if needed
            let currentNickname = nickname;
            if (!currentNickname) {
                const user = await import('@/models/User').then(mod => mod.User.findById(session.user.id));
                currentNickname = user?.username || 'Unknown';
            }

            if (!existing) {
                // New record
                await GameScore.create({
                    userId: session.user.id,
                    gameId,
                    score,
                    time,
                    nickname: currentNickname
                });
                saved = true;
                console.log(`[Score] New record for user ${session.user.id}: ${score} (${time}s)`);
            } else {
                // Check if better
                const isHigherScore = score > existing.score;
                const isSameScoreBetterTime = score === existing.score && time < existing.time;

                if (isHigherScore || isSameScoreBetterTime) {
                    existing.score = score;
                    existing.time = time;
                    if (nickname) existing.nickname = nickname; // Update nickname if provided
                    await existing.save();
                    saved = true;
                    console.log(`[Score] Updated record for user ${session.user.id}: ${score} (${time}s)`);
                }
            }
        } else {
            // Anonymous user: Create new record every time (or could limit, but for now allow all)
            // Generate random promo nickname
            const randomNum = Math.floor(Math.random() * 100);
            const promoNames = ['짐보관은짐박스', '여행의시작짐박스', '가볍게여행짐박스', '짐박스와함께'];
            const randomPromo = promoNames[Math.floor(Math.random() * promoNames.length)];
            const finalNickname = `${randomPromo}_${randomNum}`;

            await GameScore.create({
                gameId,
                score,
                time,
                nickname: finalNickname // Auto-generated promo nickname
            });
            saved = true;
            console.log(`[Score] New anonymous record: ${score} (${time}s) with nickname ${finalNickname}`);
        }

        return NextResponse.json({ success: true, saved });

    } catch (error) {
        console.error('Save score error:', error);
        return NextResponse.json({ message: 'Server error' }, { status: 500 });
    }
}
