const PushSubscription = require('../models/PushSubscription');

const subscribe = async (req, res) => {
    try {
        const subscription = req.body;
        // 이미 존재하는 구독인지 확인 (endpoint 기준으로)
        let existingSubscription = await PushSubscription.findOne({ endpoint: subscription.endpoint });

        if (existingSubscription) {
            // 기존 구독 업데이트 (키가 변경될 수 있으므로)
            existingSubscription.keys = subscription.keys;
            existingSubscription.expirationTime = subscription.expirationTime;
            await existingSubscription.save();
            console.log('기존 푸시 구독 업데이트됨:', existingSubscription);
            return res.status(200).json({ message: '기존 푸시 구독이 업데이트되었습니다.' });
        } else {
            // 새 구독 저장
            const newSubscription = new PushSubscription(subscription);
            await newSubscription.save();
            console.log('새 푸시 구독 저장됨:', newSubscription);
            return res.status(201).json({ message: '푸시 구독이 성공적으로 저장되었습니다.' });
        }
    } catch (error) {
        console.error('푸시 구독 저장 실패:', error);
        res.status(500).json({ message: '푸시 구독 저장에 실패했습니다.', error: error.message });
    }
};

module.exports = { subscribe };
