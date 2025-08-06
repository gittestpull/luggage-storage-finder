const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Storage = require('../models/Storage');
const Report = require('../models/Report');

// 관리자 로그인
router.post('/admin/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username, isAdmin: true });
        if (!user || !await bcrypt.compare(password, user.password)) {
            return res.status(401).json({ message: '인증 실패' });
        }
        const token = jwt.sign({ userId: user._id, isAdmin: user.isAdmin }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });
    } catch (e) { res.status(500).json({ message: '서버 오류' }); }
});

// 대시보드 데이터 (인증 필요)
router.get('/admin/dashboard', auth, async (req, res) => {
    try {
        const [storageCount, reportCount, userCount] = await Promise.all([
            Storage.countDocuments(),
            Report.countDocuments({ reportStatus: 'pending' }),
            User.countDocuments({ isAdmin: false })
        ]);
        res.json({ storageCount, reportCount, userCount });
    } catch (e) { res.status(500).json({ message: '서버 오류' }); }
});

// 관리자용 짐보관소 목록 (인증 필요)
router.get('/admin/storages', auth, async (req, res) => {
    try {
        res.json(await Storage.find().sort({ createdAt: -1 }));
    } catch (e) { res.status(500).json({ message: '서버 오류' }); }
});

// 짐보관소 상세 정보 (인증 필요)
router.get('/storages/:id', auth, async (req, res) => {
    try {
        const storage = await Storage.findById(req.params.id);
        if (!storage) return res.status(404).json({ message: '짐보관소를 찾을 수 없습니다.' });
        res.json(storage);
    } catch (e) { res.status(500).json({ message: '서버 오류' }); }
});

// 짐보관소 정보 업데이트 (인증 필요)
router.put('/storages/:id', auth, async (req, res) => {
    try {
        res.json(await Storage.findByIdAndUpdate(req.params.id, req.body, { new: true }));
    } catch (e) { res.status(500).json({ message: '서버 오류' }); }
});

// 짐보관소 삭제 (인증 필요)
router.delete('/storages/:id', auth, async (req, res) => {
    try {
        await Storage.findByIdAndDelete(req.params.id);
        res.json({ message: '삭제 완료' });
    } catch (e) { res.status(500).json({ message: '서버 오류' }); }
});

// 모든 제보 목록 가져오기 (인증 필요)
router.get('/admin/reports', auth, async (req, res) => {
    try {
        res.json(await Report.find().sort({ createdAt: -1 }));
    } catch (e) { res.status(500).json({ message: '서버 오류' }); }
});

// 제보 상태 업데이트 (승인/반려) 및 포인트 지급
router.patch('/admin/reports/:id', auth, async (req, res) => {
    try {
        const { status } = req.body;
        const report = await Report.findByIdAndUpdate(req.params.id, { reportStatus: status }, { new: true }).populate('reportedBy');

        if (status === 'approved') {
            const { name, address, location, openTime, closeTime, is24Hours, smallPrice, largePrice } = report;
            console.log('승인된 제보 데이터:', report);
            try {
                const newStorage = await new Storage({ name, address, location, openTime, closeTime, is24Hours, smallPrice, largePrice }).save();
                console.log('짐보관소 데이터가 성공적으로 저장되었습니다:', newStorage);
            } catch (storageSaveError) {
                console.error('짐보관소 저장 중 오류 발생:', storageSaveError);
            }

            // 포인트 지급 로직
            if (report.reportedBy) {
                report.reportedBy.points += 100; // 예시: 100 포인트 지급
                await report.reportedBy.save();
                console.log(`사용자 ${report.reportedBy.username}에게 100 포인트 지급됨. 현재 포인트: ${report.reportedBy.points}`);
            }
        }
        res.json(report);
    } catch (e) { res.status(500).json({ message: '서버 오류' }); }
});

module.exports = router;
