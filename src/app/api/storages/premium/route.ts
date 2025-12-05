import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Storage } from '@/models';

export async function GET() {
    try {
        await dbConnect();
        const premiumStorages = await Storage.find({ isPremium: true });
        return NextResponse.json(premiumStorages);
    } catch (error) {
        console.error('Error fetching premium storages:', error);
        return NextResponse.json({ message: '서버 오류' }, { status: 500 });
    }
}
