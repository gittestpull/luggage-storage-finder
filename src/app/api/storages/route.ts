import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { Storage } from '@/models';

export async function GET(request: Request) {
    try {
        await db();
        const { searchParams } = new URL(request.url);
        const searchQuery = searchParams.get('searchQuery');
        const latitude = searchParams.get('latitude');
        const longitude = searchParams.get('longitude');
        const radius = searchParams.get('radius');

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const query: any = {};

        if (searchQuery) {
            query.$or = [
                { name: { $regex: searchQuery, $options: 'i' } },
                { address: { $regex: searchQuery, $options: 'i' } },
            ];
        }

        if (latitude && longitude && radius) {
            const EARTH_RADIUS_KM = 6378.1;
            const radiusInRadians = parseFloat(radius) / EARTH_RADIUS_KM;
            query.location = {
                $geoWithin: {
                    $centerSphere: [[parseFloat(longitude), parseFloat(latitude)], radiusInRadians],
                },
            };
        }

        const storages = await Storage.find(query);
        return NextResponse.json(storages);
    } catch (error) {
        console.error('Error fetching storages:', error);
        return NextResponse.json({ message: '서버 오류' }, { status: 500 });
    }
}
