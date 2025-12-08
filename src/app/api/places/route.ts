import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Place from '@/models/Place';
import { getToken } from 'next-auth/jwt';
import { saveFile } from '@/lib/fileHandler';

export async function GET() {
    await dbConnect();
    try {
        const places = await Place.find({}).populate('reviews.user', 'username');
        return NextResponse.json({ success: true, data: places });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Server Error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    await dbConnect();
    try {
        const token = await getToken({ req });
        if (!token) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await req.formData();
        const name = formData.get('name') as string;
        const address = formData.get('address') as string;
        const description = formData.get('description') as string;
        const rating = JSON.parse(formData.get('rating') as string);
        const photos = formData.getAll('photos') as File[];

        const photoPaths = await Promise.all(
            photos.map(photo => saveFile(photo, 'uploads'))
        );

        const place = await Place.create({
            name,
            address,
            description,
            rating,
            photos: photoPaths,
        });

        return NextResponse.json({ success: true, data: place }, { status: 201 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ success: false, error: 'Server Error' }, { status: 500 });
    }
}
