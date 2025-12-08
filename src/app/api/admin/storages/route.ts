import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/auth';
import Storage from '@/models/Storage';
import connectDB from '@/lib/db';
import axios from 'axios';

async function getGeocode(address: string) {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
    try {
        const response = await axios.get(url);
        if (response.data.status === 'OK') {
            const location = response.data.results[0].geometry.location;
            return { lat: location.lat, lng: location.lng };
        }
        return null;
    } catch (error) {
        console.error('Geocoding error:', error);
        return null;
    }
}

export async function GET(req: NextRequest) {
    const admin = await verifyAdmin(req);
    if (!admin) {
        return NextResponse.json({ message: '권한이 없습니다.' }, { status: 403 });
    }

    try {
        await connectDB();
        const storages = await Storage.find()
            .populate({
                path: 'report',
                populate: { path: 'reportedBy', select: 'username' },
            })
            .sort({ createdAt: -1 });
        return NextResponse.json(storages);
    } catch (error) {
        console.error('Fetch storages error:', error);
        return NextResponse.json({ message: '서버 오류' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const admin = await verifyAdmin(req);
    if (!admin) {
        return NextResponse.json({ message: '권한이 없습니다.' }, { status: 403 });
    }

    try {
        await connectDB();
        const body = await req.json();
        const { name, address, openTime, closeTime, is24Hours, smallPrice, largePrice, isPremium } = body;

        // Get geocode for address
        const geocodeResult = await getGeocode(address);
        if (!geocodeResult) {
            return NextResponse.json(
                { message: '주소의 좌표를 찾을 수 없습니다. 정확한 주소를 입력해주세요.' },
                { status: 400 }
            );
        }

        const location = {
            type: 'Point',
            coordinates: [geocodeResult.lng, geocodeResult.lat],
        };

        const newStorage = new Storage({
            name,
            address,
            location,
            openTime,
            closeTime,
            is24Hours: is24Hours || false,
            smallPrice: smallPrice || 0,
            largePrice: largePrice || 0,
            isPremium: isPremium || false,
            status: { isOpen: true, lastUpdated: new Date() },
        });

        await newStorage.save();
        return NextResponse.json(newStorage, { status: 201 });
    } catch (error) {
        console.error('Create storage error:', error);
        return NextResponse.json({ message: '서버 오류' }, { status: 500 });
    }
}
