import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Storage from '@/models/Storage';

function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function POST(request: Request) {
    try {
        await dbConnect();
        const { latitude, longitude, preferences } = await request.json();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const query: any = {};
        if (latitude && longitude) {
            query.location = {
                $geoWithin: { $centerSphere: [[longitude, latitude], 5 / 6378.1] },
            };
        }

        const storages = await Storage.find(query);

        const scoredStorages = storages.map((storage) => {
            let score = 0;
            const reasons: string[] = [];

            if (latitude && longitude && storage.location?.coordinates) {
                const dist = getDistanceFromLatLonInKm(latitude, longitude, storage.location.coordinates[1], storage.location.coordinates[0]);
                score += Math.max(0, 30 - dist * 6);
                if (dist < 0.5) reasons.push('매우 가까움');
            }
            if (preferences?.is24Hours && storage.is24Hours) { score += 20; reasons.push('24시간 운영'); }
            if (preferences?.isPremium && storage.isPremium) { score += 20; reasons.push('프리미엄 시설'); }
            if (preferences?.budget && storage.smallPrice && storage.smallPrice <= 5000) { score += 15; reasons.push('가성비 좋음'); }
            if (preferences?.hasLargeLocker && storage.largePrice) { score += 15; reasons.push('대형 짐 보관 가능'); }

            return { ...storage.toObject(), matchScore: Math.round(score), matchReasons: reasons };
        });

        scoredStorages.sort((a, b) => b.matchScore - a.matchScore);
        return NextResponse.json(scoredStorages.slice(0, 5));
    } catch (error) {
        console.error('AI 추천 중 오류:', error);
        return NextResponse.json({ message: '서버 오류' }, { status: 500 });
    }
}
