import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import mongoose from 'mongoose';

// Report 스키마 정의
const reportSchema = new mongoose.Schema({
    name: { type: String, required: true },
    address: { type: String, required: true },
    phoneNumber: String,
    description: String,
    status: { type: String, default: 'pending' },
    createdAt: { type: Date, default: Date.now },
});

const Report = mongoose.models.Report || mongoose.model('Report', reportSchema);

export async function POST(request: NextRequest) {
    try {
        await dbConnect();

        const body = await request.json();
        const { name, address, phoneNumber, description } = body;

        if (!name || !address) {
            return NextResponse.json(
                { message: '이름과 주소는 필수입니다.' },
                { status: 400 }
            );
        }

        const report = new Report({
            name,
            address,
            phoneNumber: phoneNumber || '',
            description: description || '',
        });

        await report.save();

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
