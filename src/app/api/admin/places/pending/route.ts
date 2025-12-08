// src/app/api/admin/places/pending/route.ts
import { NextResponse } from 'next/server';
import db from '@/lib/db';
import Place from '@/models/Place';
import { getToken } from 'next-auth/jwt';

export async function GET(req: Request) {
    const token = await getToken({ req });
    // @ts-ignore
    if (!token || token.role !== 'admin') {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await db();
    try {
        const pendingPlaces = await Place.find({ status: 'pending' });
        return NextResponse.json({ success: true, data: pendingPlaces });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Server Error' }, { status: 500 });
    }
}
