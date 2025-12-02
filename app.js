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
const axios = require('axios');

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
const newsRoutes = require('./src/routes/newsRoutes');

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
app.use('/api/news', newsRoutes);

app.get('/api/maps/script', async (req, res) => {
    try {
        const callback = req.query.callback || 'initMap';
        const libraries = req.query.libraries ? `&libraries=${req.query.libraries}` : '';
        const scriptUrl = `https://maps.googleapis.com/maps/api/js?key=${process.env.GOOGLE_MAPS_API_KEY}&callback=${callback}${libraries}`;
        
        const response = await axios.get(scriptUrl);
        res.type('.js').send(response.data);
    } catch (error) {
        console.error('Error fetching Google Maps script:', error);
        res.status(500).send('Error fetching Google Maps script');
    }
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
    
    // 서버 시작 시 뉴스 즉시 업데이트
    console.log('최초 뉴스 업데이트를 시작합니다...');
    updateNews();

    // 6시간마다 뉴스 업데이트 스케줄링
    const sixHours = 6 * 60 * 60 * 1000;
    setInterval(() => {
        console.log('스케줄에 따라 뉴스 업데이트를 시작합니다...');
        updateNews();
    }, sixHours);
});

// 뉴스 업데이트 함수 불러오기
const updateNews = require('./update-news.js');

// 404 에러 처리
app.use((req, res, next) => {
    res.status(404).json({ message: 'Not Found' });
});

// 일반 에러 처리 미들웨어
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.statusCode || 500).json({
        message: err.message || 'Internal Server Error',
        error: err.name
    });
});