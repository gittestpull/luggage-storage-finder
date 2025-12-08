import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/auth';
import AccessLog from '@/models/AccessLog';
import connectDB from '@/lib/db';

export async function GET(req: NextRequest) {
    const admin = await verifyAdmin(req);
    if (!admin) {
        return NextResponse.json({ message: '권한이 없습니다.' }, { status: 403 });
    }

    try {
        await connectDB();
        const logs = await AccessLog.find()
            .sort({ timestamp: -1 })
            .limit(100);
        return NextResponse.json(logs);
    } catch (error) {
        console.error('Fetch access logs error:', error);
        return NextResponse.json({ message: '서버 오류' }, { status: 500 });
    }
}
