const express = require('express');
const router = express.Router();
const Storage = require('../models/Storage');
const Report = require('../models/Report');

const optionalAuth = require('../middleware/optionalAuth');

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

// 새 짐보관소 제보하기
router.post('/storages', optionalAuth, async (req, res) => {
    try {
        const reportData = { ...req.body };
        if (req.user) {
            reportData.reportedBy = req.user.userId;
        }
        const newReport = new Report(reportData);
        await newReport.save();
        res.status(201).json(newReport);
    } catch (e) {
        console.error('제보 저장 중 오류 발생:', e);
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
