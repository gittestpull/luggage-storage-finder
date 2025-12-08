// src/app/api/admin/places/[id]/approve/route.ts
import { NextResponse } from 'next/server';
import db from '@/lib/db';
import Place from '@/models/Place';
import { getToken } from 'next-auth/jwt';

interface Params {
    params: {
        id: string;
    }
}

export async function PUT(req: Request, { params }: Params) {
    const token = await getToken({ req });
    // @ts-ignore
    if (!token || token.role !== 'admin') {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await db();
    try {
        const place = await Place.findByIdAndUpdate(
            params.id,
            { status: 'approved' },
            { new: true }
        );
        if (!place) {
            return NextResponse.json({ success: false, error: 'Place not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true, data: place });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Server Error' }, { status: 500 });
    }
}
