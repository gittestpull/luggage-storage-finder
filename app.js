/**
 * app.js
 * 짐보관소 찾기 서비스의 메인 서버 파일
 */

// 필요한 모듈 불러오기
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const dotenv = require('dotenv');

// 환경 변수 설정
dotenv.config();

// Express 앱 초기화
const app = express();
const PORT = process.env.PORT || 3000;

// 미들웨어 설정
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// 데이터베이스 연결
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/luggage-storage', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => {
    console.log('MongoDB 연결 성공');
})
.catch(err => {
    console.error('MongoDB 연결 실패:', err);
});

// 짐보관소 스키마 정의
const storageSchema = new mongoose.Schema({
    name: { type: String, required: true },
    address: { type: String, required: true },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number],
            required: true
        }
    },
    openTime: String,
    closeTime: String,
    is24Hours: Boolean,
    smallPrice: Number,
    largePrice: Number,
    status: {
        isOpen: { type: Boolean, default: true },
        lastUpdated: { type: Date, default: Date.now }
    },
    createdAt: { type: Date, default: Date.now }
});

// 인덱스 설정
storageSchema.index({ location: '2dsphere' });

// 모델 생성
const Storage = mongoose.model('Storage', storageSchema);

// API 라우트 설정
// 모든 짐보관소 가져오기
app.get('/api/storages', async (req, res) => {
    try {
        const storages = await Storage.find();
        res.json(storages);
    } catch (error) {
        console.error('짐보관소 목록 조회 오류:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

// 검색어로 짐보관소 검색
app.get('/api/storages/search', async (req, res) => {
    try {
        const { keyword } = req.query;
        if (!keyword) {
            return res.status(400).json({ message: '검색어를 입력해주세요.' });
        }

        const storages = await Storage.find({
            $or: [
                { name: { $regex: keyword, $options: 'i' } },
                { address: { $regex: keyword, $options: 'i' } }
            ]
        });
        
        res.json(storages);
    } catch (error) {
        console.error('짐보관소 검색 오류:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

// 위치 기반 짐보관소 검색
app.get('/api/storages/near', async (req, res) => {
    try {
        const { lat, lng, maxDistance = 5000 } = req.query;
        
        if (!lat || !lng) {
            return res.status(400).json({ message: '위도와 경도를 입력해주세요.' });
        }

        const storages = await Storage.find({
            location: {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [parseFloat(lng), parseFloat(lat)]
                    },
                    $maxDistance: parseInt(maxDistance)
                }
            }
        });
        
        res.json(storages);
    } catch (error) {
        console.error('주변 짐보관소 검색 오류:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

// 새 짐보관소 제보하기
app.post('/api/storages', async (req, res) => {
    try {
        const {
            name,
            address,
            lat,
            lng,
            openTime,
            closeTime,
            is24Hours,
            smallPrice,
            largePrice
        } = req.body;

        // 필수 필드 검증
        if (!name || !address || !lat || !lng) {
            return res.status(400).json({ message: '필수 정보가 누락되었습니다.' });
        }

        // 새 짐보관소 생성
        const newStorage = new Storage({
            name,
            address,
            location: {
                type: 'Point',
                coordinates: [parseFloat(lng), parseFloat(lat)]
            },
            openTime,
            closeTime,
            is24Hours: is24Hours === 'true',
            smallPrice: parseInt(smallPrice) || 0,
            largePrice: parseInt(largePrice) || 0,
            status: {
                isOpen: true,
                lastUpdated: new Date()
            }
        });

        await newStorage.save();
        res.status(201).json({ message: '짐보관소가 성공적으로 등록되었습니다.', storage: newStorage });
    } catch (error) {
        console.error('짐보관소 등록 오류:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

// 짐보관소 상태 업데이트
app.patch('/api/storages/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { isOpen } = req.body;

        if (isOpen === undefined) {
            return res.status(400).json({ message: '상태 정보가 누락되었습니다.' });
        }

        const storage = await Storage.findByIdAndUpdate(
            id,
            {
                'status.isOpen': isOpen,
                'status.lastUpdated': new Date()
            },
            { new: true }
        );

        if (!storage) {
            return res.status(404).json({ message: '해당 짐보관소를 찾을 수 없습니다.' });
        }

        res.json(storage);
    } catch (error) {
        console.error('짐보관소 상태 업데이트 오류:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

// Google Maps API 키를 클라이언트에 전달하는 라우트
app.get('/api/maps/key', (req, res) => {
    res.json({ apiKey: process.env.GOOGLE_MAPS_API_KEY });
});

// 메인 페이지 라우트
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 서버 시작
app.listen(PORT, () => {
    console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
});