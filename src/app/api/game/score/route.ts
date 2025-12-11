import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { GameScore } from '@/models';
import connectDB from '@/lib/db';

export async function GET(req: NextRequest) {
    try {
        await connectDB();
        const session = await verifyAuth(req);
        if (!session?.user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const gameId = searchParams.get('gameId');

        if (!gameId) {
            return NextResponse.json({ message: 'Missing gameId' }, { status: 400 });
        }

        const record = await GameScore.findOne({ userId: session.user.id, gameId });

        return NextResponse.json({
            score: record ? record.score : 0,
            time: record ? record.time : 0,
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
        if (!session?.user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { gameId, score, time } = await req.json();

        if (!gameId || typeof score !== 'number' || typeof time !== 'number') {
            return NextResponse.json({ message: 'Invalid data' }, { status: 400 });
        }

        const existing = await GameScore.findOne({ userId: session.user.id, gameId });

        let saved = false;

        if (!existing) {
            // New record
            await GameScore.create({
                userId: session.user.id,
                gameId,
                score,
                time
            });
            saved = true;
        } else {
            // Check if better
            // Condition: Higher Score OR (Same Score AND Lower Time)
            const isHigherScore = score > existing.score;
            const isSameScoreBetterTime = score === existing.score && time < existing.time;

            if (isHigherScore || isSameScoreBetterTime) {
                existing.score = score;
                existing.time = time;
                await existing.save();
                saved = true;
            }
        }

        return NextResponse.json({ success: true, saved });

    } catch (error) {
        console.error('Save score error:', error);
        return NextResponse.json({ message: 'Server error' }, { status: 500 });
    }
}
