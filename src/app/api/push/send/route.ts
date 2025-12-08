import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import PushSubscription from '@/models/PushSubscription';
import connectDB from '@/lib/db';

// VAPID 키 설정
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:ysk7998@gmail.com';
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || '';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || '';

if (vapidPublicKey && vapidPrivateKey) {
    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

interface PushPayload {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    data?: { url?: string;[key: string]: any };
}

// 전체 구독자에게 푸시 알림 전송
export async function POST(req: NextRequest) {
    try {
        // API 키 검증 (간단한 인증)
        const authHeader = req.headers.get('x-api-key');
        const apiKey = process.env.PUSH_API_KEY || 'luggage-push-secret';

        if (authHeader !== apiKey) {
            return NextResponse.json(
                { message: '인증되지 않은 요청입니다.' },
                { status: 401 }
            );
        }

        if (!vapidPublicKey || !vapidPrivateKey) {
            return NextResponse.json(
                { message: 'VAPID 키가 설정되지 않았습니다.' },
                { status: 500 }
            );
        }

        await connectDB();

        const payload: PushPayload = await req.json();

        if (!payload.title || !payload.body) {
            return NextResponse.json(
                { message: '제목과 내용이 필요합니다.' },
                { status: 400 }
            );
        }

        // 모든 구독자 조회
        const subscriptions = await PushSubscription.find({});

        if (subscriptions.length === 0) {
            return NextResponse.json({
                message: '등록된 구독자가 없습니다.',
                sent: 0
            });
        }

        const pushPayload = JSON.stringify({
            title: payload.title,
            body: payload.body,
            icon: payload.icon || '/images/icon-192x192.png',
            badge: payload.badge || '/images/badge-72x72.png',
            data: payload.data || { url: '/' }
        });

        let successCount = 0;
        let failCount = 0;
        const failedEndpoints: string[] = [];

        // 모든 구독자에게 푸시 전송
        for (const subscription of subscriptions) {
            try {
                await webpush.sendNotification(
                    {
                        endpoint: subscription.endpoint,
                        keys: {
                            p256dh: subscription.keys.p256dh,
                            auth: subscription.keys.auth
                        }
                    },
                    pushPayload
                );
                successCount++;
                console.log('푸시 전송 성공:', subscription.endpoint.substring(0, 50) + '...');
            } catch (pushError: any) {
                failCount++;
                console.error('푸시 전송 실패:', subscription.endpoint.substring(0, 50) + '...', pushError.statusCode);

                // 만료된 구독 삭제
                if (pushError.statusCode === 410 || pushError.statusCode === 404) {
                    await PushSubscription.deleteOne({ _id: subscription._id });
                    console.log('만료된 구독 삭제됨:', subscription.endpoint.substring(0, 50) + '...');
                } else {
                    failedEndpoints.push(subscription.endpoint);
                }
            }
        }

        return NextResponse.json({
            message: '푸시 알림 전송 완료',
            totalSubscriptions: subscriptions.length,
            successCount,
            failCount,
            failedEndpoints: failedEndpoints.slice(0, 10) // 최대 10개만 반환
        });

    } catch (error: any) {
        console.error('푸시 전송 오류:', error);
        return NextResponse.json(
            { message: '푸시 전송 중 오류가 발생했습니다.', error: error.message },
            { status: 500 }
        );
    }
}
