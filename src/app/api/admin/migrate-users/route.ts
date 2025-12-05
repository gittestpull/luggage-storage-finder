import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/auth';
import User from '@/models/User';
import connectDB from '@/lib/db';

export async function POST(req: NextRequest) {
    const admin = await verifyAdmin(req);
    if (!admin) {
        return NextResponse.json({ message: '권한이 없습니다.' }, { status: 403 });
    }

    try {
        await connectDB();

        // Find users without createdAt and set it to now
        const result = await User.updateMany(
            { createdAt: { $exists: false } },
            { $set: { createdAt: new Date() } }
        );

        return NextResponse.json({
            message: '마이그레이션 완료',
            updatedCount: result.modifiedCount,
        });
    } catch (error) {
        console.error('Migrate users error:', error);
        return NextResponse.json({ message: '서버 오류' }, { status: 500 });
    }
}
