const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse');
const axios = require('axios');
require('dotenv').config();
const mongoose = require('mongoose');
const Storage = require('./src/models/Storage');

const csvFilePath = path.join(__dirname, 'test.csv');
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

const delay = ms => new Promise(res => setTimeout(res, ms));

async function importData() {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB connected successfully.');

        await Storage.deleteMany({});
        console.log('Existing storage data cleared.');

        const records = [];
        const parser = fs
            .createReadStream(csvFilePath)
            .pipe(parse({
                columns: true,
                skip_empty_lines: true,
                trim: true,
            }));

        parser.on('readable', function() {
            let record;
            while ((record = parser.read()) !== null) {
                records.push(record);
            }
        });

        await new Promise((resolve) => {
            parser.on('end', resolve);
        });

        const storages = [];

        for (const record of records) {
            let latitude = 0;
            let longitude = 0;
            let geocodedAddress = '';

            if (GOOGLE_MAPS_API_KEY) {
                // Attempt geocoding with station name first
                let addressToGeocode = record['역명'].trim();
                try {
                    let geoResponse = await axios.get(
                        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(addressToGeocode)}&key=${GOOGLE_MAPS_API_KEY}`
                    );

                    if (geoResponse.data.results.length > 0) {
                        latitude = geoResponse.data.results[0].geometry.location.lat;
                        longitude = geoResponse.data.results[0].geometry.location.lng;
                        geocodedAddress = addressToGeocode;
                        // console.log(`Geocoded ${geocodedAddress}: Lat ${latitude}, Lng ${longitude}`);
                    } else {
                        // If station name alone fails, try with detailed location
                        addressToGeocode = `${record['역명']} ${record['상세위치']}`.trim();
                        geoResponse = await axios.get(
                            `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(addressToGeocode)}&key=${GOOGLE_MAPS_API_KEY}`
                        );

                        if (geoResponse.data.results.length > 0) {
                            latitude = geoResponse.data.results[0].geometry.location.lat;
                            longitude = geoResponse.data.results[0].geometry.location.lng;
                            geocodedAddress = addressToGeocode;
                            // console.log(`Geocoded ${geocodedAddress}: Lat ${latitude}, Lng ${longitude}`);
                        } else {
                            // console.warn(`Could not geocode address: ${addressToGeocode}`);
                        }
                    }
                } catch (geoError) {
                    console.error(`Error geocoding address ${addressToGeocode}:`, geoError.message);
                }
                await delay(100); // Add a small delay to respect API rate limits
            }

            // Price parsing logic
            let smallPrice = null;
            let largePrice = null;
            const priceString = record['이용요금'] || '';

            const smallMatch = priceString.match(/소\s*:\s*([\d,]+)원/);
            if (smallMatch) {
                smallPrice = parseInt(smallMatch[1].replace(/,/g, ''), 10);
            }

            const largeMatch = priceString.match(/대\s*:\s*([\d,]+)원/);
            if (largeMatch) {
                largePrice = parseInt(largeMatch[1].replace(/,/g, ''), 10);
            }

            storages.push({
                name: `${record['철도운영기관명']} ${record['운영노선명']} ${record['역명']}`.trim(),
                address: `${record['역명']} ${record['상세위치']}`.trim(),
                phoneNumber: record['전화번호'] ? record['전화번호'].trim() : '', // Map 전화번호 to phoneNumber
                price: priceString, // Keep original price string for reference
                smallPrice: smallPrice,
                largePrice: largePrice,
                lockerCounts: record['시설수'] ? record['시설수'].trim() : '', // Map 시설수 to lockerCounts
                type: record['무인편의시설코드'] ? record['무인편의시설코드'].trim() : '',
                location: {
                    type: 'Point',
                    coordinates: [longitude, latitude]
                },
                description: record['참고사항'] ? record['참고사항'].trim() : '',
                imageUrl: '',
                isAvailable: true,
                adminManaged: true,
                isPremium: false, // isPremium 필드 추가 및 false로 초기화
                dataStandardDate: record['데이터 기준일자'] ? record['데이터 기준일자'].trim() : '', // Map 데이터 기준일자
                createdAt: new Date()
            });
        }

        await Storage.insertMany(storages);
        console.log(`${storages.length} storage locations imported successfully.`);

    } catch (error) {
        console.error('Error importing data:', error);
    } finally {
        mongoose.connection.close();
        console.log('MongoDB connection closed.');
    }
}

importData();
