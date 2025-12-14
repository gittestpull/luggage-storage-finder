import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import FortuneRanking from '@/models/FortuneRanking';

export async function GET() {
  try {
    await dbConnect();
    // Sort by tier (ascending: 1 is best) then by date (descending: newest first)
    const rankings = await FortuneRanking.find({})
      .sort({ tier: 1, createdAt: -1 })
      .limit(50);

    return NextResponse.json(rankings);
  } catch (error) {
    console.error('Error fetching fortune rankings:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    const { name, tier, prizeName, probability } = body;

    if (!name || !tier || !prizeName || !probability) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Server-side validation: Only allow recording rankings for tier <= 6 (Good Luck or better)
    // Tier 6 is 1/10,000.
    if (tier > 6) {
       return NextResponse.json({ message: 'Not eligible for ranking' }, { status: 200 });
    }

    const newRanking = await FortuneRanking.create({
      name,
      tier,
      prizeName,
      probability
    });

    return NextResponse.json(newRanking, { status: 201 });
  } catch (error) {
    console.error('Error creating fortune ranking:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
