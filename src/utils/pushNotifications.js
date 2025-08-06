const webpush = require('web-push');
const PushSubscription = require('../models/PushSubscription');

// VAPID 키 설정
webpush.setVapidDetails(
    process.env.VAPID_SUBJECT,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
);

async function sendPushNotification(payload) {
    const subscriptions = await PushSubscription.find({});
    console.log(`발견된 푸시 구독 수: ${subscriptions.length}`);

    for (const sub of subscriptions) {
        try {
            await webpush.sendNotification(sub, JSON.stringify(payload));
            console.log('푸시 알림 전송 성공:', sub.endpoint);
        } catch (pushError) {
            console.error('푸시 알림 전송 실패:', sub.endpoint, pushError);
            // 구독이 만료되었거나 유효하지 않은 경우 삭제
            if (pushError.statusCode === 410 || pushError.statusCode === 404) {
                console.log('만료된 구독 삭제:', sub.endpoint);
                await PushSubscription.deleteOne({ _id: sub._id });
            }
        }
    }
}

module.exports = { sendPushNotification };
