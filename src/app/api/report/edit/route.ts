import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Report from '@/models/Report';

export async function POST(request: NextRequest) {
    try {
        await dbConnect();

        const body = await request.json();
        const {
            storageId,
            storageName,
            name,
            address,
            phoneNumber,
            openTime,
            closeTime,
            is24Hours,
            smallPrice,
            largePrice,
            description,
        } = body;

        if (!name || !address) {
            return NextResponse.json(
                { message: '이름과 주소는 필수입니다.' },
                { status: 400 }
            );
        }

        if (!storageId) {
            return NextResponse.json(
                { message: '수정할 보관소 정보가 없습니다.' },
                { status: 400 }
            );
        }

        // 수정 요청 리포트 생성
        const report = new Report({
            storageId,
            storageName: storageName || name,
            name,
            address,
            phoneNumber,
            openTime,
            closeTime,
            is24Hours,
            smallPrice,
            largePrice,
            description,
            reportStatus: 'pending',
        });

        await report.save();

        return NextResponse.json({
            success: true,
            message: '수정 요청이 접수되었습니다. 관리자 검토 후 반영됩니다.',
        });
    } catch (error) {
        console.error('Edit request error:', error);
        return NextResponse.json(
            { message: '수정 요청 처리 중 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}
