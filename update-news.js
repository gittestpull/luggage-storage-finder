// 로컬 개발 환경에서만 dotenv 사용
if (process.env.NODE_ENV !== 'production') {
    try {
        require('dotenv').config();
    } catch (e) {
        // dotenv not available, use existing env vars
    }
}
const axios = require('axios');
const mongoose = require('mongoose');
const NewsArticle = require('./src/models/NewsArticle');
const connectDB = require('./src/config/db');

const NEWS_API_KEY = process.env.NEWS_API_KEY;
const NEWS_API_URL = 'https://newsapi.org/v2/everything';

const LOCATION_KEYWORDS = [
    // 서울시 자치구 (가나다 순) - 더 구체적인 것을 먼저 찾도록 서울보다 앞에 배치
    '강남구', '강동구', '강북구', '강서구', '관악구', '광진구', '구로구', '금천구', '노원구', '도봉구',
    '동대문구', '동작구', '마포구', '서대문구', '서초구', '성동구', '성북구', '송파구', '양천구', '영등포구',
    '용산구', '은평구', '종로구', '중구', '중랑구',
    // 주요 광역시 및 시 (가나다 순)
    '서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종',
    '수원', '고양', '용인', '성남', '부천', '안산', '남양주', '안양', '화성', '평택', '의정부',
    '파주', '시흥', '김포', '광명', '군포', '오산', '이천', '양주', '구리', '안성', '포천',
    '의왕', '하남', '여주', '동두천', '과천',
    '춘천', '원주', '강릉', '동해', '태백', '속초', '삼척',
    '청주', '충주', '제천',
    '천안', '공주', '보령', '아산', '서산', '논산', '계룡', '당진',
    '전주', '군산', '익산', '정읍', '남원', '김제',
    '목포', '여수', '순천', '나주', '광양',
    '포항', '경주', '김천', '안동', '구미', '영주', '영천', '상주', '문경', '경산',
    '창원', '진주', '통영', '사천', '김해', '밀양', '거제', '양산',
    '제주', '서귀포'
];

const getAllLocationsFromText = async (title, description) => {
    const textToSearch = `${title} ${description || ''}`;
    const foundLocations = LOCATION_KEYWORDS.filter(loc => textToSearch.includes(loc));

    const locations = [];
    const processedQueries = new Set(); // 중복 쿼리 방지

    // 명확한 지역 키워드 검색 및 지오코딩
    for (const loc of foundLocations) {
        if (processedQueries.has(loc)) continue;
        processedQueries.add(loc);

        try {
            const geoResponse = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
                params: {
                    address: loc + ', 대한민국',
                    key: process.env.GOOGLE_MAPS_API_KEY,
                    language: 'ko'
                }
            });

            if (geoResponse.data.results && geoResponse.data.results.length > 0) {
                const { lat, lng } = geoResponse.data.results[0].geometry.location;

                // 역지오코딩을 통해 상세 주소 파싱
                const reverseGeoResponse = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
                    params: {
                        latlng: `${lat},${lng}`,
                        key: process.env.GOOGLE_MAPS_API_KEY,
                        language: 'ko'
                    }
                });

                if (reverseGeoResponse.data.results && reverseGeoResponse.data.results.length > 0) {
                    const components = reverseGeoResponse.data.results[0].address_components;
                    const getComponent = (type) => components.find(c => c.types.includes(type))?.long_name || null;

                    const area = getComponent('administrative_area_level_1'); // 시/도
                    const city = getComponent('locality'); // 시/군
                    const district = getComponent('sublocality_level_1'); // 구
                    const neighborhood = getComponent('sublocality_level_2'); // 동

                    const addressParts = [];
                    if (area) addressParts.push(area);
                    if (city && city !== area) addressParts.push(city);
                    if (district && district !== city) addressParts.push(district);
                    if (neighborhood) addressParts.push(neighborhood);

                    const constructed_address = [...new Set(addressParts)].join(' ').trim();
                    const koreanRegex = /^[가-힣\s\d\w-]+$/;

                    if (constructed_address && koreanRegex.test(constructed_address)) {
                        locations.push({ name: constructed_address, lat, lng });
                    } else {
                        // 한국어 주소 구성 실패 시, 쿼리 지역명 사용
                        locations.push({ name: loc, lat, lng });
                    }
                } else {
                    // 역지오코딩 실패 시, 쿼리 지역명 사용
                    locations.push({ name: loc, lat, lng });
                }
            }
        } catch (error) {
            console.error(`Geocoding process error for location "${loc}":`, error.message);
        }
    }

    // 명확한 지역 키워드가 없었고, 제목에 tvN 같은 회사명이 있을 경우 제목으로 지오코딩 시도
    if (locations.length === 0 && !foundLocations.length) {
        try {
            const geoResponse = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
                params: {
                    address: title + ', 대한민국', // 기사 제목 전체를 쿼리로 사용
                    key: process.env.GOOGLE_MAPS_API_KEY,
                    language: 'ko'
                }
            });

            if (geoResponse.data.results && geoResponse.data.results.length > 0) {
                const { lat, lng } = geoResponse.data.results[0].geometry.location;
                const result = geoResponse.data.results[0];
                const formatted_address = result.formatted_address;
                const simple_address = formatted_address.startsWith('대한민국 ') ? formatted_address.substring(5) : formatted_address;

                // 역지오코딩을 통해 상세 주소 파싱 (기존 로직 재활용)
                const reverseGeoResponse = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
                    params: {
                        latlng: `${lat},${lng}`,
                        key: process.env.GOOGLE_MAPS_API_KEY,
                        language: 'ko'
                    }
                });

                if (reverseGeoResponse.data.results && reverseGeoResponse.data.results.length > 0) {
                    const components = reverseGeoResponse.data.results[0].address_components;
                    const getComponent = (type) => components.find(c => c.types.includes(type))?.long_name || null;

                    const area = getComponent('administrative_area_level_1'); // 시/도
                    const city = getComponent('locality'); // 시/군
                    const district = getComponent('sublocality_level_1'); // 구
                    const neighborhood = getComponent('sublocality_level_2'); // 동

                    const addressParts = [];
                    if (area) addressParts.push(area);
                    if (city && city !== area) addressParts.push(city);
                    if (district && district !== city) addressParts.push(district);
                    if (neighborhood) addressParts.push(neighborhood);

                    const constructed_address = [...new Set(addressParts)].join(' ').trim();
                    const koreanRegex = /^[가-힣\s\d\w-]+$/;

                    if (constructed_address && koreanRegex.test(constructed_address)) {
                        locations.push({ name: constructed_address, lat, lng });
                    } else {
                        // 한국어 주소 구성 실패 시, 원본 제목에서 추출된 주소 사용
                        locations.push({ name: simple_address || title, lat, lng });
                    }
                } else {
                    locations.push({ name: simple_address || title, lat, lng });
                }
            }
        } catch (error) {
            console.error(`Geocoding process error for title "${title}":`, error.message);
        }
    }

    // 모든 시도가 실패하면 기본 서울 위치 반환
    if (locations.length === 0) {
        locations.push({ name: '서울', lat: 37.5665, lng: 126.9780 });
    }

    return locations;
};

const fetchNews = async (category, query) => {
    try {
        const response = await axios.get(NEWS_API_URL, {
            params: {
                q: query,
                apiKey: NEWS_API_KEY,
                language: 'ko',
                sortBy: 'publishedAt',
                pageSize: 10
            }
        });

        const articles = [];
        for (const article of response.data.articles) {
            const articleLocations = await getAllLocationsFromText(article.title, article.description);
            articles.push({
                title: article.title,
                description: article.description,
                url: article.url,
                imageUrl: article.urlToImage,
                publishedAt: new Date(article.publishedAt),
                source: { name: article.source.name },
                category,
                locations: articleLocations // locations 필드 사용
            });
        }

        return articles;
    } catch (error) {
        console.error(`Error fetching ${category} news:`, error.message);
        return [];
    }
};

const updateNews = async () => {
    console.log('Starting news update...');

    console.log('Fetching news...');
    const entertainmentNews = await fetchNews('entertainment', 'k-pop');
    const travelNews = await fetchNews('travel', '경복궁');
    const localNews = await fetchNews('local', '부산 국제 영화제');

    const allNews = [...entertainmentNews, ...travelNews, ...localNews];

    if (allNews.length === 0) {
        console.log('No news fetched. Update process finished.');
        return;
    }

    // 기존 뉴스 기사 전체 삭제
    console.log('Clearing existing news articles...');
    try {
        await NewsArticle.deleteMany({});
        console.log('Existing news articles cleared.');
    } catch (error) {
        console.error('Error clearing existing news articles:', error.message);
        // Do not proceed if clearing fails
        return;
    }

    console.log(`Fetched ${allNews.length} articles. Saving to database...`);

    for (const articleData of allNews) {
        try {
            // Use a specific field for matching, e.g., the URL, to avoid duplicates
            await NewsArticle.updateOne({ url: articleData.url }, articleData, { upsert: true });
        } catch (error) {
            console.error(`Error saving article: ${articleData.title}`, error.message);
        }
    }

    console.log('News update complete.');
};

module.exports = updateNews;

// 독립 실행 시 main 함수 실행
if (require.main === module) {
    (async () => {
        console.log('Connecting to database...');
        await connectDB();
        console.log('Database connected.');
        await updateNews();
        console.log('Closing database connection...');
        await mongoose.connection.close();
        console.log('Done.');
        process.exit(0);
    })();
}