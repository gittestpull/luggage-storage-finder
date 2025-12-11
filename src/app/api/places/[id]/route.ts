import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Place from '@/models/Place';

interface Params {
    params: Promise<{
        id: string;
    }>
}

export async function GET(req: NextRequest, { params }: Params) {
    await dbConnect();
    const { id } = await params;
    try {
        const place = await Place.findById(id).populate('reviews.user', 'username').populate('tips.user', 'username');
        if (!place) {
            return NextResponse.json({ success: false, error: 'Place not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true, data: place });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Server Error' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: Params) {
    await dbConnect();
    const { id } = await params;
    try {
        const body = await req.json();
        const place = await Place.findByIdAndUpdate(id, body, {
            new: true,
            runValidators: true,
        });
        if (!place) {
            return NextResponse.json({ success: false, error: 'Place not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true, data: place });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Server Error' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: Params) {
    await dbConnect();
    const { id } = await params;
    try {
        const deletedPlace = await Place.deleteOne({ _id: id });
        if (deletedPlace.deletedCount === 0) {
            return NextResponse.json({ success: false, error: 'Place not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true, data: {} });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Server Error' }, { status: 500 });
    }
}
