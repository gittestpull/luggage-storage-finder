const express = require('express');
const router = express.Router();
const Storage = require('../models/Storage');
const Report = require('../models/Report');

const optionalAuth = require('../middleware/optionalAuth');
const auth = require('../middleware/auth');

// 프리미엄 짐보관소 가져오기
router.get('/storages/premium', async (req, res) => {
    try {
        const premiumStorages = await Storage.find({ isPremium: true });
        res.json(premiumStorages);
    } catch (e) {
        res.status(500).json({ message: '서버 오류' });
    }
});

// 모든 짐보관소 가져오기
router.get('/storages', optionalAuth, async (req, res) => {
    try {
        let storages;
        if (req.user) { // 로그인된 사용자 (토큰이 유효한 경우)
            storages = await Storage.find();
        } else { // 로그인되지 않은 사용자
            storages = await Storage.find().limit(2);
        }
        res.json(storages);
    } catch (e) { res.status(500).json({ message: '서버 오류' }); }
});

// 검색어로 짐보관소 검색
router.get('/storages/search', async (req, res) => {
    try {
        const { keyword } = req.query;
        if (!keyword) return res.status(400).json({ message: '검색어를 입력해주세요.' });
        res.json(await Storage.find({ $or: [{ name: { $regex: keyword, $options: 'i' } }, { address: { $regex: keyword, $options: 'i' } }] }));
    } catch (e) { res.status(500).json({ message: '서버 오류' }); }
});

// 새 짐보관소 제보하기 (기존 기능 유지)
router.post('/storages', optionalAuth, async (req, res) => {
    try {
        const reportData = { ...req.body };
        if (req.user) {
            reportData.reportedBy = req.user.userId;
        }
        // 새로운 짐보관소 제보이므로 storageId와 storageName은 없음
        reportData.storageId = null;
        reportData.storageName = null;

        const newReport = new Report(reportData);
        await newReport.save();
        res.status(201).json(newReport);
    } catch (e) {
        console.error('새 짐보관소 제보 저장 중 오류 발생:', e);
        res.status(500).json({ message: '서버 오류', error: e.message });
    }
});

// 기존 짐보관소 정보 오류 신고하기 (새로운 기능)
router.post('/reports', optionalAuth, async (req, res) => {
    try {
        const { storageId, storageName, description } = req.body;
        if (!storageId || !storageName || !description) {
            return res.status(400).json({ message: '필수 정보가 누락되었습니다.' });
        }

        const express = require('express');
const router = express.Router();
const Storage = require('../models/Storage');
const Report = require('../models/Report');

const optionalAuth = require('../middleware/optionalAuth');
const auth = require('../middleware/auth'); // Add auth middleware

// 모든 짐보관소 가져오기
router.get('/storages', optionalAuth, async (req, res) => {
    try {
        let storages;
        if (req.user) { // 로그인된 사용자 (토큰이 유효한 경우)
            storages = await Storage.find();
        } else { // 로그인되지 않은 사용자
            storages = await Storage.find().limit(2);
        }
        res.json(storages);
    } catch (e) { res.status(500).json({ message: '서버 오류' }); }
});

// 검색어로 짐보관소 검색
router.get('/storages/search', async (req, res) => {
    try {
        const { keyword } = req.query;
        if (!keyword) return res.status(400).json({ message: '검색어를 입력해주세요.' });
        res.json(await Storage.find({ $or: [{ name: { $regex: keyword, $options: 'i' } }, { address: { $regex: keyword, $options: 'i' } }] }));
    } catch (e) { res.status(500).json({ message: '서버 오류', error: e.message }); }
});

// 새 짐보관소 제보하기 (기존 기능 유지)
router.post('/storages', optionalAuth, async (req, res) => {
    try {
        const reportData = { ...req.body };
        if (req.user) {
            reportData.reportedBy = req.user.userId;
        }
        // 새로운 짐보관소 제보이므로 storageId와 storageName은 없음
        reportData.storageId = null;
        reportData.storageName = null;

        const newReport = new Report(reportData);
        await newReport.save();
        res.status(201).json(newReport);
    } catch (e) {
        console.error('새 짐보관소 제보 저장 중 오류 발생:', e);
        res.status(500).json({ message: '서버 오류', error: e.message });
    }
});

// 기존 짐보관소 정보 오류 신고하기 (새로운 기능)
router.post('/reports', optionalAuth, async (req, res) => {
    try {
        const { storageId, storageName, description } = req.body;
        if (!storageId || !storageName || !description) {
            return res.status(400).json({ message: '필수 정보가 누락되었습니다.' });
        }

        const express = require('express');
const router = express.Router();
const Storage = require('../models/Storage');
const Report = require('../models/Report');

const optionalAuth = require('../middleware/optionalAuth');
const auth = require('../middleware/auth'); // auth 미들웨어 추가

// 모든 짐보관소 가져오기
router.get('/storages', optionalAuth, async (req, res) => {
    try {
        let storages;
        if (req.user) { // 로그인된 사용자
            storages = await Storage.find();
        } else { // 비로그인 사용자
            storages = await Storage.find().limit(2);
        }
        res.json(storages);
    } catch (e) { res.status(500).json({ message: '서버 오류' }); }
});

// 검색어로 짐보관소 검색
router.get('/storages/search', async (req, res) => {
    try {
        const { keyword } = req.query;
        if (!keyword) return res.status(400).json({ message: '검색어를 입력해주세요.' });
        const results = await Storage.find({ $or: [{ name: { $regex: keyword, $options: 'i' } }, { address: { $regex: keyword, $options: 'i' } }] });
        res.json(results);
    } catch (e) { res.status(500).json({ message: '서버 오류', error: e.message }); }
});

// 새 짐보관소 제보하기
router.post('/storages', optionalAuth, async (req, res) => {
    try {
        const reportData = { ...req.body, type: 'new' }; // 제보 유형 추가
        if (req.user) {
            reportData.reportedBy = req.user.userId;
        }
        const newReport = new Report(reportData);
        await newReport.save();
        res.status(201).json(newReport);
    } catch (e) {
        console.error('새 짐보관소 제보 저장 중 오류 발생:', e);
        res.status(500).json({ message: '서버 오류', error: e.message });
    }
});

// 기존 짐보관소 정보 오류 신고하기
router.post('/reports', optionalAuth, async (req, res) => {
    try {
        const { storageId, storageName, description } = req.body;
        if (!storageId || !description) {
            return res.status(400).json({ message: '필수 정보(storageId, description)가 누락되었습니다.' });
        }

        const reportData = {
            type: 'correction',
            storageId,
            name: `(오류신고) ${storageName || '이름 없는 보관소'}`,
            address: `(오류신고) ${storageName || '이름 없는 보관소'}`,
            location: { type: 'Point', coordinates: [0, 0] }, // 임시 위치 정보 추가
            description,
        };

        if (req.user) {
            reportData.reportedBy = req.user.userId;
        }

        const newReport = new Report(reportData);
        await newReport.save();
        res.status(201).json(newReport);
    } catch (e) {
        console.error('정보 오류 신고 저장 중 오류 발생:', e);
        res.status(500).json({ message: '서버 오류', error: e.message });
    }
});

// 사용자가 제출한 신고 이력 조회
router.get('/reports/my', auth, async (req, res) => {
    try {
        const myReports = await Report.find({ reportedBy: req.user.userId }).populate('reportedBy', 'username');
        res.json(myReports);
    } catch (e) {
        console.error('내 신고 이력 조회 중 오류 발생:', e);
        res.status(500).json({ message: '서버 오류', error: e.message });
    }
});


const premiumController = require('../controllers/premiumController');
const pushController = require('../controllers/pushController');
const PushSubscription = require('../models/PushSubscription'); // PushSubscription 모델 임포트
const { sendPushNotification } = require('../utils/pushNotifications'); // 푸시 알림 함수 임포트

// 프리미엄 서비스 요청
router.post('/premium-request', premiumController.sendPremiumRequestNotification);

// 푸시 구독 정보 저장
router.post('/subscribe', pushController.subscribe);

// 특정 짐보관소 알림 구독
router.post('/storages/:id/subscribe', optionalAuth, async (req, res) => {
    try {
        const storageId = req.params.id;
        const userId = req.user.userId; // auth 미들웨어에서 설정된 사용자 ID
        const { endpoint, expirationTime, keys } = req.body;

        // 이미 구독된 상태인지 확인
        let subscription = await PushSubscription.findOne({ endpoint, storageId });

        if (subscription) {
            return res.status(200).json({ message: '이미 구독 중입니다.' });
        }

        subscription = new PushSubscription({
            endpoint,
            expirationTime,
            keys,
            userId,
            storageId
        });

        await subscription.save();
        res.status(201).json({ message: '알림 구독 성공!' });
    } catch (e) {
        console.error('알림 구독 중 오류 발생:', e);
        res.status(500).json({ message: '서버 오류', error: e.message });
    }
});

// 짐보관소 예약 요청
router.post('/reservations', auth, async (req, res) => {
    try {
        const { storageId, storageName, reserverName, reserverEmail, reserverPhone } = req.body;

        if (!storageId || !storageName || !reserverName || !reserverEmail) {
            return res.status(400).json({ message: '필수 예약 정보가 누락되었습니다.' });
        }

        // 해당 짐보관소를 구독한 모든 사용자에게 푸시 알림 발송
        const subscriptions = await PushSubscription.find({ storageId: storageId });

        const notificationPayload = {
            title: `새로운 예약 요청: ${storageName}`,
            body: `${reserverName}님으로부터 예약 요청이 도착했습니다.`, 
            icon: '/images/icon-192x192.png',
            data: { 
                url: '/admin/#report-management', // 관리자 페이지로 이동
                storageId: storageId,
                reserverName: reserverName,
                reserverEmail: reserverEmail,
                reserverPhone: reserverPhone
            }
        };

        for (const sub of subscriptions) {
            try {
                await sendPushNotification(sub, notificationPayload);
            } catch (notificationError) {
                console.error('푸시 알림 발송 실패:', notificationError);
                // 유효하지 않은 구독은 제거 (선택 사항)
                if (notificationError.statusCode === 410) { // GONE 상태 코드 (구독 만료)
                    await PushSubscription.findByIdAndRemove(sub._id);
                }
            }
        }

        res.status(200).json({ message: '예약 요청이 성공적으로 접수되었습니다. 관련 구독자들에게 알림이 전송되었습니다.' });
    } catch (e) {
        console.error('예약 요청 처리 중 오류 발생:', e);
        res.status(500).json({ message: '서버 오류', error: e.message });
    }
});

// Google Maps API 키 제공
router.get('/maps/key', (req, res) => {
    res.json({ apiKey: process.env.GOOGLE_MAPS_API_KEY });
});

module.exports = router;

        if (req.user) {
            reportData.reportedBy = req.user.userId;
        }

        const newReport = new Report(reportData);
        await newReport.save();
        res.status(201).json(newReport);
    } catch (e) {
        console.error('정보 오류 신고 저장 중 오류 발생:', e);
        res.status(500).json({ message: '서버 오류', error: e.message });
    }
});

// 사용자가 제출한 신고 이력 조회 (새로운 엔드포인트)
router.get('/reports/my', auth, async (req, res) => {
    try {
        const myReports = await Report.find({ reportedBy: req.user.userId }).populate('reportedBy', 'username');
        res.json(myReports);
    } catch (e) {
        console.error('내 신고 이력 조회 중 오류 발생:', e);
        res.status(500).json({ message: '서버 오류', error: e.message });
    }
});

const premiumController = require('../controllers/premiumController');
const pushController = require('../controllers/pushController');

// 프리미엄 서비스 요청
router.post('/premium-request', premiumController.sendPremiumRequestNotification);

// 푸시 구독 정보 저장
router.post('/subscribe', pushController.subscribe);

module.exports = router;

        if (req.user) {
            reportData.reportedBy = req.user.userId;
        }

        const newReport = new Report(reportData);
        await newReport.save();
        res.status(201).json(newReport);
    } catch (e) {
        console.error('정보 오류 신고 저장 중 오류 발생:', e);
        res.status(500).json({ message: '서버 오류', error: e.message });
    }
});

const premiumController = require('../controllers/premiumController');
const pushController = require('../controllers/pushController');

// 프리미엄 서비스 요청
router.post('/premium-request', premiumController.sendPremiumRequestNotification);

// 푸시 구독 정보 저장
router.post('/subscribe', pushController.subscribe);

module.exports = router;
