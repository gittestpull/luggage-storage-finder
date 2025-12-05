import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/auth';
import Storage from '@/models/Storage';
import connectDB from '@/lib/db';

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const admin = await verifyAdmin(req);
    if (!admin) {
        return NextResponse.json({ message: '권한이 없습니다.' }, { status: 403 });
    }

    try {
        await connectDB();
        const { id } = await params;
        const { isOpen } = await req.json();
        const storage = await Storage.findByIdAndUpdate(
            id,
            { 'status.isOpen': isOpen, 'status.lastUpdated': new Date() },
            { new: true }
        );
        if (!storage) {
            return NextResponse.json(
                { message: '짐보관소를 찾을 수 없습니다.' },
                { status: 404 }
            );
        }
        return NextResponse.json(storage);
    } catch (error) {
        console.error('Update storage status error:', error);
        return NextResponse.json({ message: '서버 오류' }, { status: 500 });
    }
}
