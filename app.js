/**
 * app.js
 * 짐보관소 찾기 서비스의 메인 서버 파일
 */

// 필요한 모듈 불러오기
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

// 환경 변수 설정
dotenv.config();

// 데이터베이스 연결
const connectDB = require('./src/config/db');
mongoose.set('debug', true);
connectDB();

// 라우트 불러오기
const publicRoutes = require('./src/routes/publicRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const authRoutes = require('./src/routes/authRoutes');

// Express 앱 초기화
const app = express();
const PORT = process.env.PORT || 3000;

// 미들웨어 설정
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// API 라우트 사용
app.use('/api', publicRoutes);
app.use('/api', adminRoutes);
app.use('/api', authRoutes);

// Google Maps API 키를 클라이언트에 전달하는 라우트 (이것은 publicRoutes에 포함될 수도 있지만, 일단 여기에 유지)
app.get('/api/maps/key', (req, res) => {
    res.json({ apiKey: process.env.GOOGLE_MAPS_API_KEY });
});

// 메인 페이지 라우트
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 관리자 페이지 라우트
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin', 'login.html'));
});

app.get('/admin/index.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin', 'index.html'));
});

// 서버 시작
app.listen(PORT, () => {
    console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
});