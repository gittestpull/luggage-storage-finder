// deleteAndInsertStorages.js
require('dotenv').config();
process.env.MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/luggage-storage'; // Ensure localhost for script execution
const mongoose = require('mongoose');
const Storage = require('./src/models/Storage');
const connectDB = require('./src/config/db');
const axios = require('axios'); // axios 사용

const csvData = `철도운영기관명,운영노선명,역명,관리번호,무인편의시설코드,크기,지상/지하구분,역층,상세위치,시설수,이용요금,운영사,전화번호,데이터 기준일자,참고사항,
공항철도,공항철도선,서울역,1,물품보관함,기타,지하,3,(B3) 고객안내센터 근처,대 : 16개 / 중 : 8개 / 소 : 14개,"대 : 4,000원 / 중 : 3,000원 / 소 : 2,000원 (1시간 당)",주식회사 새누,1899-4711,20241218,,
공항철도,공항철도선,공덕역,2,물품보관함,기타,지하,3,(B3) 고객안내센터 근처,대 : 5개 / 중 : 3개 / 소 : 9개,"대 : 4,000원 / 중 : 3,000원 / 소 : 2,000원 (1시간 당)",주식회사 새누,1899-4711,20241218,,
공항철도,공항철도선,홍대입구역,3,물품보관함,기타,지하,2,"(B2) 3,4번 출입구 방향",대 : 22개 / 중 : 10개 / 소 : 16개,"대 : 4,000원 / 중 : 3,000원 / 소 : 2,000원 (1시간 당)",주식회사 새누,1899-4711,20241218,,
공항철도,공항철도선,DMC역,4,물품보관함,기타,지하,1,"(B1) 8,9번 출입구 방향",대 : 12개 / 중 : 7개 / 소 : 10개,"대 : 4,000원 / 중 : 3,000원 / 소 : 2,000원 (1시간 당)",주식회사 새누,1899-4711,20241218,,
공항철도,공항철도선,마곡나루역,5,물품보관함,기타,지하,1,"(B1) 3,4번 출입구 방향",대 : 5개 / 중 : 3개 / 소 : 9개,"대 : 4,000원 / 중 : 3,000원 / 소 : 2,000원 (1시간 당)",주식회사 새누,1899-4711,20241218,,
공항철도,공항철도선,김포공항역,6,물품보관함,기타,지하,1,(B1) 4번 출입구 방향,대 : 6개 / 중 : 4개 / 소 : 10개,"대 : 4,000원 / 중 : 3,000원 / 소 : 2,000원 (1시간 당)",주식회사 새누,1899-4711,20241218,,
공항철도,공항철도선,검암역,7,물품보관함,기타,지상,1,(1) 여자화장실 근처,대 : 3개 / 중 : 2개 / 소 : 5개,"대 : 4,000원 / 중 : 3,000원 / 소 : 2,000원 (1시간 당)",주식회사 새누,1899-4711,20241218,,
공항철도,공항철도선,운서역,8,물품보관함,기타,지상,1,"(1) 1번 추입구 방향",대 : 7개 / 중 : 2개 / 소 : 5개,"대 : 4,000원 / 중 : 3,000원 / 소 : 2,000원 (1시간 당)",주식회사 새누,1899-4711,20241218,,`;

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

async function deleteAndInsertStorages() {
    await connectDB();

    try {
        console.log('기존 짐보관소 데이터 삭제 중...');
        await Storage.deleteMany({});
        console.log('기존 짐보관소 데이터 삭제 완료.');

        const lines = csvData.trim().split('\n');
        const headers = lines[0].split(',');
        const newStorages = [];

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(/,(?=(?:(?:[^""]*\"){2})*[^\"]*$)/); // 콤마로 분리하되 따옴표 안의 콤마는 무시
            const row = {};
            headers.forEach((header, index) => {
                row[header.trim()] = values[index] ? values[index].replace(/^"|"$/g, '').trim() : '';
            });

            const fullAddress = row['역명'].trim();
            console.log(`Geocoding 주소: ${fullAddress}`);
            const geocodeResult = await getGeocode(fullAddress);

            let smallPrice = 0;
            let largePrice = 0;
            const smallPriceMatch = row['이용요금'].match(/소\s*:\s*(\d+,?\d*)\s*원/);
            if (smallPriceMatch) {
                smallPrice = parseInt(smallPriceMatch[1].replace(/,/g, ''));
            }
            const largePriceMatch = row['이용요금'].match(/대\s*:\s*(\d+,?\d*)\s*원/);
            if (largePriceMatch) {
                largePrice = parseInt(largePriceMatch[1].replace(/,/g, ''));
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
                    // 추가 필드 (필요시 Storage 모델에 추가 후 사용)
                    // capacity: row['시설수'], 
                    // operator: row['운영사'],
                    // phoneNumber: row['전화번호'],
                    // notes: row['참고사항']
                });
            } else {
                console.warn(`짐보관소 ${row['역명']} (${fullAddress})의 위도/경도를 찾을 수 없어 건너뜁니다.`);
            }
        }

        console.log(`${newStorages.length}개의 새로운 짐보관소 데이터 삽입 중...`);
        await Storage.insertMany(newStorages);
        console.log('새로운 짐보관소 데이터 삽입 완료.');

    } catch (error) {
        console.error('데이터 처리 중 오류 발생:', error);
    } finally {
        mongoose.connection.close();
        console.log('MongoDB 연결 종료.');
    }
}

deleteAndInsertStorages();
