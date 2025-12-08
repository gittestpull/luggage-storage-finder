import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Place from '@/models/Place';

interface Params {
    params: {
        id: string;
    }
}

export async function GET(req: NextRequest, { params }: Params) {
    await dbConnect();
    try {
        const place = await Place.findById(params.id).populate('reviews.user', 'username').populate('tips.user', 'username');
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
    try {
        const body = await req.json();
        const place = await Place.findByIdAndUpdate(params.id, body, {
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
    try {
        const deletedPlace = await Place.deleteOne({ _id: params.id });
        if (deletedPlace.deletedCount === 0) {
            return NextResponse.json({ success: false, error: 'Place not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true, data: {} });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Server Error' }, { status: 500 });
    }
}
