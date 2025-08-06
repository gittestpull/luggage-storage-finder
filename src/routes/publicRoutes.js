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
router.post('/storages', async (req, res) => {
    try {
        // TODO: 사용자 인증 후 reportedBy 필드 추가
        const newReport = new Report(req.body);
        await newReport.save();
        res.status(201).json(newReport);
    } catch (e) {
        console.error('제보 저장 중 오류 발생:', e);
        res.status(500).json({ message: '서버 오류', error: e.message });
    }
});

module.exports = router;
