const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const auth = require('../middleware/auth');

// 현재 로그인된 사용자 정보 가져오기
router.get('/user/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password'); // 비밀번호 제외
        if (!user) {
            return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
        }
        res.json(user);
    } catch (error) {
        console.error('사용자 정보 가져오기 오류:', error);
        res.status(500).json({ message: '서버 오류' });
    }
});

// 사용자 회원가입 (일반 사용자용)
router.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: '이미 존재하는 사용자입니다.' });
        }
        const user = new User({ username, password, isAdmin: false }); // 일반 사용자
        await user.save();
        res.status(201).json({ message: '회원가입 성공' });
    } catch (error) {
        res.status(500).json({ message: '서버 오류' });
    }
});

// 사용자 로그인 (일반 사용자용)
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user || !await bcrypt.compare(password, user.password)) {
            return res.status(401).json({ message: '인증 실패' });
        }
        const token = jwt.sign({ userId: user._id, isAdmin: user.isAdmin }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token, user: { id: user._id, username: user.username, isAdmin: user.isAdmin, points: user.points, submittedReportPoints: user.submittedReportPoints, approvedReportPoints: user.approvedReportPoints } });
    } catch (error) {
        res.status(500).json({ message: '서버 오류' });
    }
});

module.exports = router;
