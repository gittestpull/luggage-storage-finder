import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Place from '@/models/Place';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        await dbConnect();

        // Admin Token Verification
        const headersList = headers();
        const authorization = headersList.get('authorization');

        if (!authorization || !authorization.startsWith('Bearer ')) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        // const token = authorization.split(' ')[1];
        // if (token !== process.env.ADMIN_TOKEN) {
        //    return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 });
        // }

        const places = await Place.find({ status: 'approved' }).sort({ createdAt: -1 });

        return NextResponse.json({ success: true, data: places });
    } catch (error) {
        console.error('Failed to fetch approved places:', error);
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
}
