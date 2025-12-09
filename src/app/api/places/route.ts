import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import Place from '@/models/Place';
import { saveFile } from '@/lib/fileHandler';

export async function GET() {
    await db();
    try {
        const places = await Place.find({ status: 'approved' }).populate('reviews.user', 'username');
        return NextResponse.json({ success: true, data: places });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Server Error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    await db();
    try {
        const formData = await req.formData();
        const name = formData.get('name') as string;
        const address = formData.get('address') as string;
        const description = (formData.get('description') as string) || '사용자 제보';
        const ratingStr = formData.get('rating') as string;
        const rating = ratingStr ? JSON.parse(ratingStr) : { location: 3, taste: 3, price: 3, service: 3, atmosphere: 3 };
        const photos = formData.getAll('photos') as File[];

        const photoPaths = await Promise.all(
            photos.filter(p => p.size > 0).map(photo => saveFile(photo, 'uploads'))
        );

        const place = await Place.create({
            name,
            address,
            description,
            rating,
            photos: photoPaths,
            location: {
                type: 'Point',
                coordinates: [126.9780, 37.5665], // 기본값: 서울 시청
            },
        });

        return NextResponse.json({ success: true, data: place }, { status: 201 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ success: false, error: 'Server Error' }, { status: 500 });
    }
}

