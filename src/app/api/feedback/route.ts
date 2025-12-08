import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import mongoose from 'mongoose';

// Feedback 스키마 정의
const feedbackSchema = new mongoose.Schema({
    email: String,
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
});

// 모델이 이미 존재하면 사용, 아니면 새로 생성
const Feedback = mongoose.models.Feedback || mongoose.model('Feedback', feedbackSchema);

export async function POST(request: NextRequest) {
    try {
        await dbConnect();

        const body = await request.json();
        const { email, content } = body;

        if (!content) {
            return NextResponse.json(
                { message: '의견 내용은 필수입니다.' },
                { status: 400 }
            );
        }

        const feedback = new Feedback({
            email: email || '',
            content,
        });

        await feedback.save();

        return NextResponse.json({
            success: true,
            message: '소중한 의견이 접수되었습니다.'
        });
    } catch (error) {
        console.error('Feedback error:', error);
        return NextResponse.json(
            { message: '의견 접수 중 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}

// 모든 피드백 가져오기 (관리자용)
export async function GET() {
    try {
        await dbConnect();
        const feedbacks = await Feedback.find().sort({ createdAt: -1 });
        return NextResponse.json(feedbacks);
    } catch (error) {
        console.error('Feedback fetch error:', error);
        return NextResponse.json(
            { message: '피드백 목록을 가져오는 중 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}
