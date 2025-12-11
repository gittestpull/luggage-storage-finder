import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Place from '@/models/Place';
import { getToken } from 'next-auth/jwt';
import { saveFile } from '@/lib/fileHandler';

interface Params {
    params: Promise<{
        id: string;
    }>
}

export async function POST(req: NextRequest, { params }: Params) {
    await dbConnect();
    const { id } = await params;
    try {
        const token = await getToken({ req });
        if (!token) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await req.formData();
        const text = formData.get('text') as string;
        const photo = formData.get('photo') as File | null;

        const place = await Place.findById(id);
        if (!place) {
            return NextResponse.json({ success: false, error: 'Place not found' }, { status: 404 });
        }

        let photoPath: string | undefined;
        if (photo) {
            photoPath = await saveFile(photo, 'uploads');
        }

        const review = {
            text,
            photo: photoPath,
            user: token.sub,
        };

        place.reviews.push(review as any);
        await place.save();

        // Populate user details before sending back
        const updatedPlace = await Place.findById(id).populate('reviews.user', 'username').populate('tips.user', 'username');

        return NextResponse.json({ success: true, data: updatedPlace });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ success: false, error: 'Server Error' }, { status: 500 });
    }
}
