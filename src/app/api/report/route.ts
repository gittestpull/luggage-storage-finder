import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Report from '@/models/Report';
import User from '@/models/User';

export async function POST(request: NextRequest) {
    try {
        await dbConnect();

        const body = await request.json();
        const { name, address, phoneNumber, description, username } = body;

        if (!name || !address) {
            return NextResponse.json(
                { message: '이름과 주소는 필수입니다.' },
                { status: 400 }
            );
        }

        let userId = null;

        // If username provided, try to find the user
        if (username) {
            const user = await User.findOne({ username });
            if (user) {
                userId = user._id;
            }
        }

        const report = new Report({
            name,
            address,
            phoneNumber: phoneNumber || '',
            description: description || '',
            reportedBy: userId,
            reportedByUsername: username || undefined, // Save the string even if not found? No, only save if provided.
        });

        await report.save();

        // Optional: Award small points for submission?
        // User requested "points when approved", but previous code had "submittedReportPoints".
        // I will increment the stat if user found.
        if (userId) {
            await User.findByIdAndUpdate(userId, {
                $inc: { submittedReportPoints: 10 } // Give 10 points stats for submission (maybe not balance)
            });
            // If we want to give balance points for submission too:
            // await User.findByIdAndUpdate(userId, { $inc: { points: 10 } });
            // For now, I'll stick to just tracking the stat as "Submitted Report Points".
        }

        return NextResponse.json({
            success: true,
            message: '제보가 접수되었습니다. 검토 후 등록됩니다.'
        });
    } catch (error) {
        console.error('Report error:', error);
        return NextResponse.json(
            { message: '제보 접수 중 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}
