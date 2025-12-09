// src/app/api/admin/places/[id]/approve/route.ts
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import Place from '@/models/Place';

interface Params {
    params: Promise<{
        id: string;
    }>
}

export async function POST(req: NextRequest, { params }: Params) {
    const { id } = await params;

    // 어드민 토큰 검증
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await db();
    try {
        const place = await Place.findByIdAndUpdate(
            id,
            { status: 'approved' },
            { new: true }
        );
        if (!place) {
            return NextResponse.json({ success: false, error: 'Place not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true, data: place });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ success: false, error: 'Server Error' }, { status: 500 });
    }
}
