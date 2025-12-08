import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/auth';
import Report from '@/models/Report';
import connectDB from '@/lib/db';

export async function GET(req: NextRequest) {
    const admin = await verifyAdmin(req);
    if (!admin) {
        return NextResponse.json({ message: '권한이 없습니다.' }, { status: 403 });
    }

    try {
        await connectDB();
        const reports = await Report.find()
            .populate('reportedBy', 'username')
            .sort({ createdAt: -1 });
        return NextResponse.json(reports);
    } catch (error) {
        console.error('Fetch reports error:', error);
        return NextResponse.json({ message: '서버 오류' }, { status: 500 });
    }
}
