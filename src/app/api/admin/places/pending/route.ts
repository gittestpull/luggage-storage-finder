// src/app/api/admin/places/pending/route.ts
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import Place from '@/models/Place';

export async function GET(req: NextRequest) {
    // 어드민 토큰 검증
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await db();
    try {
        const pendingPlaces = await Place.find({ status: 'pending' }).sort({ createdAt: -1 });
        return NextResponse.json({ success: true, data: pendingPlaces });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ success: false, error: 'Server Error' }, { status: 500 });
    }
}
