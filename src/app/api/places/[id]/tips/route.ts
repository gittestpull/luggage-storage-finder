import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Place from '@/models/Place';
import { getToken } from 'next-auth/jwt';

interface Params {
    params: {
        id: string;
    }
}

export async function POST(req: NextRequest, { params }: Params) {
    await dbConnect();
    try {
        const token = await getToken({ req });
        if (!token) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }
        const body = await req.json();
        const place = await Place.findById(params.id);
        if (!place) {
            return NextResponse.json({ success: false, error: 'Place not found' }, { status: 404 });
        }
        const tip = {
            ...body,
            user: token.sub,
        };
        place.tips.push(tip);
        await place.save();
        return NextResponse.json({ success: true, data: place });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Server Error' }, { status: 500 });
    }
}
