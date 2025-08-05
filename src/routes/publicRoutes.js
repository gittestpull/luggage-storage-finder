const express = require('express');
const router = express.Router();
const Storage = require('../models/Storage');
const Report = require('../models/Report');

// 모든 짐보관소 가져오기
router.get('/storages', async (req, res) => {
    try {
        res.json(await Storage.find());
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
        res.status(201).json(await new Report(req.body).save());
    } catch (e) { res.status(500).json({ message: '서버 오류' }); }
});

module.exports = router;
