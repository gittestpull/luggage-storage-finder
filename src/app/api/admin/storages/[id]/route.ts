import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/auth';
import Storage from '@/models/Storage';
import connectDB from '@/lib/db';

import { sendPushToAll } from '@/lib/push';

import { getGeocode } from '@/lib/geocoding';

export async function PUT(
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
        const body = await req.json();

        // 현재 상태 확인
        const currentStorage = await Storage.findById(id);
        if (!currentStorage) {
            return NextResponse.json(
                { message: '짐보관소를 찾을 수 없습니다.' },
                { status: 404 }
            );
        }

        const wasNotPremium = !currentStorage.isPremium;

        // 주소가 변경된 경우 좌표 업데이트
        if (body.address && body.address !== currentStorage.address) {
            const geocodeResult = await getGeocode(body.address);
            if (geocodeResult) {
                body.location = {
                    type: 'Point',
                    coordinates: [geocodeResult.lng, geocodeResult.lat],
                };
            }
        }

        const storage = await Storage.findByIdAndUpdate(id, body, { new: true });

        if (!storage) {
            return NextResponse.json(
                { message: '짐보관소를 찾을 수 없습니다.' },
                { status: 404 }
            );
        }

        // 프리미엄으로 변경된 경우 푸시 알림 전송 (body에 isPremium이 있고 true인 경우)
        if (body.isPremium && wasNotPremium) {
            const pushResult = await sendPushToAll({
                title: '🎉 새 프리미엄 짐보관소 등록!',
                body: `${storage.name} - ${storage.address}에 새로운 프리미엄 보관소가 등록되었습니다.`,
                icon: '/images/icon-192x192.png',
                badge: '/images/badge-72x72.png',
                data: { url: '/' }
            });
            console.log(`프리미엄 보관소 등록 알림 (수정 API): ${storage.name}`, pushResult);
        }

        return NextResponse.json(storage);
    } catch (error) {
        console.error('Update storage error:', error);
        return NextResponse.json({ message: '서버 오류' }, { status: 500 });
    }
}

export async function DELETE(
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
        await Storage.findByIdAndDelete(id);
        return NextResponse.json({ message: '삭제 완료' });
    } catch (error) {
        console.error('Delete storage error:', error);
        return NextResponse.json({ message: '서버 오류' }, { status: 500 });
    }
}
