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
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

dotenv.config();

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
}).then(() => console.log('MongoDB 연결 성공')).catch(err => console.error('MongoDB 연결 실패:', err));

// --- 스키마 정의 ---

const storageSchema = new mongoose.Schema({
    name: { type: String, required: true },
    address: { type: String, required: true },
    location: { type: { type: String, enum: ['Point'], default: 'Point' }, coordinates: { type: [Number], required: true } },
    openTime: String,
    closeTime: String,
    is24Hours: Boolean,
    smallPrice: Number,
    largePrice: Number,
    status: { isOpen: { type: Boolean, default: true }, lastUpdated: { type: Date, default: Date.now } },
    createdAt: { type: Date, default: Date.now }
});
storageSchema.index({ location: '2dsphere' });
const Storage = mongoose.model('Storage', storageSchema);

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isAdmin: { type: Boolean, default: false },
    points: { type: Number, default: 0 }
});
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, await bcrypt.genSalt(10));
    next();
});
const User = mongoose.model('User', userSchema);

const reportSchema = new mongoose.Schema({
    name: { type: String, required: true },
    address: { type: String, required: true },
    location: { type: { type: String, enum: ['Point'], default: 'Point' }, coordinates: { type: [Number], required: true } },
    openTime: String,
    closeTime: String,
    is24Hours: Boolean,
    smallPrice: Number,
    largePrice: Number,
    description: String,
    reportStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    createdAt: { type: Date, default: Date.now }
});
const Report = mongoose.model('Report', reportSchema);

// --- 인증 미들웨어 ---
const auth = (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded.isAdmin) return res.status(403).send({ error: '관리자 권한이 필요합니다.' });
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).send({ error: '인증이 필요합니다.' });
    }
};

// --- 공개 API 라우트 ---

app.get('/api/storages', async (req, res) => {
    try {
        res.json(await Storage.find());
    } catch (e) { res.status(500).json({ message: '서버 오류' }); }
});

app.get('/api/storages/search', async (req, res) => {
    try {
        const { keyword } = req.query;
        if (!keyword) return res.status(400).json({ message: '검색어를 입력해주세요.' });
        res.json(await Storage.find({ $or: [{ name: { $regex: keyword, $options: 'i' } }, { address: { $regex: keyword, $options: 'i' } }] }));
    } catch (e) { res.status(500).json({ message: '서버 오류' }); }
});

app.post('/api/storages', async (req, res) => {
    try {
        res.status(201).json(await new Report(req.body).save());
    } catch (e) { res.status(500).json({ message: '서버 오류' }); }
});

app.get('/api/maps/key', (req, res) => res.json({ apiKey: process.env.GOOGLE_MAPS_API_KEY }));

// --- 관리자 인증 API ---

app.post('/api/admin/login', async (req, res) => {
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

// --- 관리자 기능 API (인증 필요) ---

app.get('/api/admin/dashboard', auth, async (req, res) => {
    try {
        const [storageCount, reportCount, userCount] = await Promise.all([
            Storage.countDocuments(),
            Report.countDocuments({ reportStatus: 'pending' }),
            User.countDocuments({ isAdmin: false })
        ]);
        res.json({ storageCount, reportCount, userCount });
    } catch (e) { res.status(500).json({ message: '서버 오류' }); }
});

app.get('/api/admin/storages', auth, async (req, res) => {
    try {
        res.json(await Storage.find().sort({ createdAt: -1 }));
    } catch (e) { res.status(500).json({ message: '서버 오류' }); }
});

app.put('/api/storages/:id', auth, async (req, res) => {
    try {
        res.json(await Storage.findByIdAndUpdate(req.params.id, req.body, { new: true }));
    } catch (e) { res.status(500).json({ message: '서버 오류' }); }
});

app.delete('/api/storages/:id', auth, async (req, res) => {
    try {
        await Storage.findByIdAndDelete(req.params.id);
        res.json({ message: '삭제 완료' });
    } catch (e) { res.status(500).json({ message: '서버 오류' }); }
});

app.get('/api/admin/reports', auth, async (req, res) => {
    try {
        res.json(await Report.find().sort({ createdAt: -1 }));
    } catch (e) { res.status(500).json({ message: '서버 오류' }); }
});

app.patch('/api/admin/reports/:id', auth, async (req, res) => {
    try {
        const { status } = req.body;
        const report = await Report.findByIdAndUpdate(req.params.id, { reportStatus: status }, { new: true });
        if (status === 'approved') {
            const { name, address, location, openTime, closeTime, is24Hours, smallPrice, largePrice } = report;
            await new Storage({ name, address, location, openTime, closeTime, is24Hours, smallPrice, largePrice }).save();
        }
        res.json(report);
    } catch (e) { res.status(500).json({ message: '서버 오류' }); }
});

// --- 메인 페이지 라우트 ---
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 서버 시작
app.listen(PORT, () => {
    console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
});
