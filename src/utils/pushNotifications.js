const webpush = require('web-push');
const PushSubscription = require('../models/PushSubscription');

// VAPID 키 설정
webpush.setVapidDetails(
    process.env.VAPID_SUBJECT,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
);

async function sendPushNotification(subscription, payload) {
    try {
        await webpush.sendNotification(subscription, JSON.stringify(payload));
        console.log('푸시 알림 전송 성공:', subscription.endpoint);
    } catch (pushError) {
        console.error('푸시 알림 전송 실패:', subscription.endpoint, pushError);
        // 구독이 만료되었거나 유효하지 않은 경우 삭제
        if (pushError.statusCode === 410 || pushError.statusCode === 404) {
            console.log('만료된 구독 삭제:', subscription.endpoint);
            await PushSubscription.deleteOne({ _id: subscription._id });
        }
        throw pushError; // 에러를 다시 던져서 호출자에게 알림
    }
}

module.exports = { sendPushNotification };
