import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';

// VAPID 키 설정
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:ysk7998@gmail.com';
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || '';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || '';

if (vapidPublicKey && vapidPrivateKey) {
    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

export async function POST(req: NextRequest) {
    try {
        const { subscription } = await req.json();

        if (!subscription || !subscription.endpoint) {
            return NextResponse.json({ message: '유효하지 않은 구독 정보입니다.' }, { status: 400 });
        }

        if (!vapidPublicKey || !vapidPrivateKey) {
            return NextResponse.json({ message: '서버 VAPID 키 설정 오류' }, { status: 500 });
        }

        const payload = JSON.stringify({
            title: '🔔 테스트 알림',
            body: '이 알림이 보이면 푸시 기능이 정상 동작하는 것입니다!',
            icon: '/images/icon-192x192.png',
            badge: '/images/badge-72x72.png',
            data: { url: '/test-push' }
        });

        const result = await webpush.sendNotification(subscription, payload);
        console.log('테스트 푸시 전송 성공:', result);

        return NextResponse.json({ message: '전송 성공', result });
    } catch (error: any) {
        console.error('테스트 푸시 전송 실패:', error);
        return NextResponse.json({
            message: '전송 실패',
            error: error.message,
            statusCode: error.statusCode,
            body: error.body
        }, { status: 500 });
    }
}
