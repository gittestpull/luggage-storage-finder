import webpush from 'web-push';
import PushSubscription from '@/models/PushSubscription';

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
export async function sendPushToAll(payload: PushPayload) {
    if (!vapidPublicKey || !vapidPrivateKey) {
        console.warn('VAPID 키가 설정되지 않아 푸시 알림을 전송할 수 없습니다.');
        return { sent: 0, failed: 0 };
    }

    const subscriptions = await PushSubscription.find({});
    let sent = 0;
    let failed = 0;

    const pushPayload = JSON.stringify(payload);

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
            sent++;
        } catch (error: any) {
            failed++;
            if (error.statusCode === 410 || error.statusCode === 404) {
                await PushSubscription.deleteOne({ _id: subscription._id });
            }
        }
    }

    console.log(`푸시 알림 전송 완료: 성공 ${sent}, 실패 ${failed}`);
    return { sent, failed };
}
