import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/auth';
import User from '@/models/User';
import Storage from '@/models/Storage';
import Report from '@/models/Report';
import Place from '@/models/Place';
import connectDB from '@/lib/db';

function escapeRegExp(string: string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function GET(req: NextRequest) {
    try {
        const admin = await verifyAdmin(req);
        if (!admin) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();

        const { searchParams } = new URL(req.url);
        const query = searchParams.get('q');

        if (!query || query.trim().length === 0) {
            return NextResponse.json({
                users: [],
                storages: [],
                reports: [],
                places: []
            });
        }

        const escapedQuery = escapeRegExp(query);
        const regex = new RegExp(escapedQuery, 'i'); // Case-insensitive partial match

        const [users, storages, reports, places] = await Promise.all([
            User.find({ username: regex }).sort({ createdAt: -1 }).limit(20).lean(),
            Storage.find({
                $or: [{ name: regex }, { address: regex }]
            }).sort({ createdAt: -1 }).limit(20).lean(),
            Report.find({
                $or: [{ name: regex }, { address: regex }, { description: regex }, { storageName: regex }]
            }).populate('reportedBy', 'username').sort({ createdAt: -1 }).limit(20).lean(),
            Place.find({
                $or: [{ name: regex }, { address: regex }, { description: regex }]
            }).sort({ createdAt: -1 }).limit(20).lean()
        ]);

        return NextResponse.json({
            users,
            storages,
            reports,
            places
        });

    } catch (error) {
        console.error('Search error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
