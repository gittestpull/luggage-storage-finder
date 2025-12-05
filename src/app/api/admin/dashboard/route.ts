import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/auth';
import Storage from '@/models/Storage';
import Report from '@/models/Report';
import User from '@/models/User';
import connectDB from '@/lib/db';

export async function GET(req: NextRequest) {
    const admin = await verifyAdmin(req);
    if (!admin) {
        return NextResponse.json({ message: '권한이 없습니다.' }, { status: 403 });
    }

    try {
        await connectDB();

        const [
            storageCount,
            reportCount,
            regularUserCount,
            adminUserCount,
            recentUsers,
            recentReports,
            reportStats,
        ] = await Promise.all([
            Storage.countDocuments(),
            Report.countDocuments({ reportStatus: 'pending' }),
            User.countDocuments({ isAdmin: false }),
            User.countDocuments({ isAdmin: true }),
            User.find().sort({ createdAt: -1 }).limit(5).select('username createdAt'),
            Report.find()
                .sort({ createdAt: -1 })
                .limit(5)
                .populate('reportedBy', 'username'),
            Report.aggregate([
                { $group: { _id: '$reportedBy', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 10 },
                {
                    $lookup: {
                        from: 'users',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'reporter',
                    },
                },
                { $unwind: '$reporter' },
                { $project: { _id: 0, username: '$reporter.username', count: 1 } },
            ]),
        ]);

        const recentActivities = [...recentUsers, ...recentReports]
            .sort((a: any, b: any) => b.createdAt - a.createdAt)
            .slice(0, 10)
            .map((item: any) => ({
                ...item.toObject(),
                type: item.username ? 'user' : 'report',
            }));

        return NextResponse.json({
            storageCount,
            reportCount,
            regularUserCount,
            adminUserCount,
            recentActivities,
            reportStats,
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        return NextResponse.json({ message: '서버 오류' }, { status: 500 });
    }
}
