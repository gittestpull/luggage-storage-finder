const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Storage = require('../models/Storage');
const Report = require('../models/Report');
const multer = require('multer'); // multer 임포트
const axios = require('axios'); // axios 임포트
const fs = require('fs'); // 파일 시스템 모듈 임포트
const { parse } = require('csv-parse'); // CSV 파싱 라이브러리 임포트
const { exec } = require('child_process'); // child_process 모듈 임포트

// Multer 설정: 파일이 메모리에 저장되도록 설정 (작은 파일에 적합)
const upload = multer({ storage: multer.memoryStorage() });

// Google Geocoding API 함수
async function getGeocode(address) {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
    try {
        const response = await axios.get(url);
        if (response.data.status === 'OK') {
            const location = response.data.results[0].geometry.location;
            return { lat: location.lat, lng: location.lng };
        } else {
            console.warn(`Geocoding failed for address: ${address}, Status: ${response.data.status}`);
            return null;
        }
    } catch (error) {
        console.error(`Error during geocoding for ${address}:`, error.message);
        return null;
    }
}

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
        const [storageCount, reportCount, regularUserCount, adminUserCount] = await Promise.all([
            Storage.countDocuments(),
            Report.countDocuments({ reportStatus: 'pending' }),
            User.countDocuments({ isAdmin: false }),
            User.countDocuments({ isAdmin: true })
        ]);
        res.json({ storageCount, reportCount, regularUserCount, adminUserCount });
    } catch (e) { res.status(500).json({ message: '서버 오류' }); }
});

// 관리자용 짐보관소 목록 (인증 필요)
router.get('/admin/storages', auth, async (req, res) => {
    try {
        res.json(await Storage.find().populate({ path: 'report', populate: { path: 'reportedBy', select: 'username' } }).sort({ createdAt: -1 }));
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

// 짐보관소 상태 업데이트 (관리자용)
router.patch('/admin/storages/:id/status', auth, async (req, res) => {
    try {
        const { isOpen } = req.body;
        const storage = await Storage.findByIdAndUpdate(req.params.id, { 'status.isOpen': isOpen, 'status.lastUpdated': new Date() }, { new: true });
        if (!storage) return res.status(404).json({ message: '짐보관소를 찾을 수 없습니다.' });
        res.json(storage);
    } catch (e) { res.status(500).json({ message: '서버 오류' }); }
});

// 여러 짐보관소 상태 일괄 업데이트 (관리자용)
router.patch('/admin/storages/bulk-status', auth, async (req, res) => {
    try {
        const { ids, isOpen } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: '유효한 짐보관소 ID 배열이 필요합니다.' });
        }
        const updateResult = await Storage.updateMany(
            { _id: { $in: ids } },
            { $set: { 'status.isOpen': isOpen, 'status.lastUpdated': new Date() } }
        );
        res.json({ message: `${updateResult.modifiedCount}개의 짐보관소 상태가 업데이트되었습니다.` });
    } catch (e) { res.status(500).json({ message: '서버 오류' }); }
});

// 짐보관소 일괄 추가 (CSV 업로드)
router.post('/admin/storages/bulk-upload', auth, upload.single('csvFile'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'CSV 파일을 업로드해주세요.' });
    }

    try {
        const csvBuffer = req.file.buffer.toString('utf8');
        const records = await new Promise((resolve, reject) => {
            parse(csvBuffer, {
                columns: true, // 첫 줄을 헤더로 사용
                skip_empty_lines: true
            }, (err, records) => {
                if (err) {
                    return reject(err);
                }
                resolve(records);
            });
        });

        let insertedCount = 0;
        let skippedCount = 0;
        const newStorages = [];

        for (const row of records) {
            const fullAddress = row['역명'].trim(); // 역명만으로 지오코딩 시도
            const geocodeResult = await getGeocode(fullAddress);

            let smallPrice = 0;
            let largePrice = 0;

            // '이용요금' 파싱 로직
            const smallPriceMatch = row['이용요금'] ? row['이용요금'].match(/소\s*:\s*(\d+,?\d*)\s*원/) : null;
            if (smallPriceMatch) {
                smallPrice = parseInt(smallPriceMatch[1].replace(/,/g, ''));
            }
            const largePriceMatch = row['이용요금'] ? row['이용요금'].match(/대\s*:\s*(\d+,?\d*)\s*원/) : null;
            if (largePriceMatch) {
                largePrice = parseInt(largePriceMatch[1].replace(/,/g, ''));
            }
            const specialLargePriceMatch = row['이용요금'] ? row['이용요금'].match(/특대\s*:\s*(\d+,?\d*)\s*원/) : null;
            if (specialLargePriceMatch) {
                largePrice = parseInt(specialLargePriceMatch[1].replace(/,/g, ''));
            }

            let createdAt = new Date();
            if (row['데이터 기준일자']) {
                const year = parseInt(row['데이터 기준일자'].substring(0, 4));
                const month = parseInt(row['데이터 기준일자'].substring(4, 6)) - 1; // 월은 0부터 시작
                const day = parseInt(row['데이터 기준일자'].substring(6, 8));
                createdAt = new Date(year, month, day);
            }

            if (geocodeResult) {
                newStorages.push({
                    name: row['역명'],
                    address: fullAddress,
                    location: {
                        type: 'Point',
                        coordinates: [geocodeResult.lng, geocodeResult.lat] // 경도, 위도 순서
                    },
                    openTime: '', // CSV에 정보 없음
                    closeTime: '', // CSV에 정보 없음
                    is24Hours: false, // CSV에 정보 없음
                    smallPrice: smallPrice,
                    largePrice: largePrice,
                    status: { isOpen: true, lastUpdated: new Date() },
                    createdAt: createdAt,
                });
                insertedCount++;
            } else {
                console.warn(`짐보관소 ${row['역명']} (${fullAddress})의 위도/경도를 찾을 수 없어 건너뜁니다.`);
                skippedCount++;
            }
        }

        if (newStorages.length > 0) {
            await Storage.insertMany(newStorages);
        }

        res.json({
            message: 'CSV 업로드 및 짐보관소 추가 완료',
            insertedCount: insertedCount,
            skippedCount: skippedCount
        });

    } catch (e) {
        console.error('짐보관소 일괄 추가 중 오류 발생:', e);
        res.status(500).json({ message: '짐보관소 일괄 추가 중 서버 오류가 발생했습니다.', error: e.message });
    }
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

// 모든 사용자 목록 가져오기 (인증 필요)
router.get('/admin/users', auth, async (req, res) => {
    try {
        res.json(await User.find().select('-password').sort({ createdAt: -1 }));
    } catch (e) { res.status(500).json({ message: '서버 오류' }); }
});

// 사용자 생성 (인증 필요)
router.post('/admin/users', auth, async (req, res) => {
    try {
        const { username, password, isAdmin, points } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: '사용자 이름과 비밀번호는 필수입니다.' });
        }

        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(409).json({ message: '이미 존재하는 사용자 이름입니다.' });
        }

        const newUser = new User({
            username,
            password,
            isAdmin: isAdmin || false,
            points: points || 0
        });

        await newUser.save();
        res.status(201).json({ message: '사용자가 성공적으로 생성되었습니다.', user: newUser });
    } catch (e) {
        console.error('사용자 생성 중 오류 발생:', e);
        res.status(500).json({ message: '서버 오류' });
    }
});

// 사용자 수정 (인증 필요)
router.put('/admin/users/:id', auth, async (req, res) => {
    try {
        const { username, password, isAdmin, points } = req.body;
        const updateData = { username, isAdmin, points };

        if (password) {
            updateData.password = await bcrypt.hash(password, 10);
        }

        const updatedUser = await User.findByIdAndUpdate(req.params.id, updateData, { new: true }).select('-password');

        if (!updatedUser) {
            return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
        }
        res.json({ message: '사용자가 성공적으로 업데이트되었습니다.', user: updatedUser });
    } catch (e) {
        console.error('사용자 업데이트 중 오류 발생:', e);
        res.status(500).json({ message: '서버 오류' });
    }
});

// 사용자 삭제 (인증 필요)
router.delete('/admin/users/:id', auth, async (req, res) => {
    try {
        const deletedUser = await User.findByIdAndDelete(req.params.id);
        if (!deletedUser) {
            return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
        }
        res.json({ message: '사용자가 성공적으로 삭제되었습니다.' });
    } catch (e) {
        console.error('사용자 삭제 중 오류 발생:', e);
        res.status(500).json({ message: '서버 오류' });
    }
});

// 사용자 삭제 (인증 필요)
router.delete('/admin/users/:id', auth, async (req, res) => {
    try {
        const deletedUser = await User.findByIdAndDelete(req.params.id);
        if (!deletedUser) {
            return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
        }
        res.json({ message: '사용자가 성공적으로 삭제되었습니다.' });
    } catch (e) {
        console.error('사용자 삭제 중 오류 발생:', e);
        res.status(500).json({ message: '서버 오류' });
    }
});

// 애플리케이션 재시작 (인증 필요)
router.post('/admin/system/restart', auth, async (req, res) => {
    try {
        console.log('애플리케이션 재시작 요청 수신...');
        res.status(200).json({ message: '애플리케이션 재시작 명령을 실행합니다.' });

        // 비동기적으로 재시작 명령 실행
        exec('docker-compose up -d --force-recreate', (error, stdout, stderr) => {
            if (error) {
                console.error(`exec error: ${error}`);
                return;
            }
            console.log(`stdout: ${stdout}`);
            console.error(`stderr: ${stderr}`);
        });

    } catch (e) {
        console.error('애플리케이션 재시작 중 오류 발생:', e);
        res.status(500).json({ message: '서버 오류' });
    }
});

module.exports = router;
