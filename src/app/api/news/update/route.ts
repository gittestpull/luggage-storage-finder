import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { NewsArticle } from '@/models/NewsArticle';
import connectDB from '@/lib/db';

const NEWS_API_KEY = process.env.NEWS_API_KEY;
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const NEWS_API_URL = 'https://newsapi.org/v2/everything';

const LOCATION_KEYWORDS = [
    // 주요 랜드마크 및 번화가 (가나다 순) - 가장 구체적이므로 최상단 배치
    '홍대', '명동', '이태원', '강남역', '신촌', '여의도', '잠실', '성수', '건대', '대학로', '압구정', '가로수길', '삼성동', '코엑스', '광화문', '인사동', '북촌', '삼청동', '동대문', '남대문', '노량진', '용산역', '서울역', '김포공항', '인천공항',
    // 서울시 주요 동 (가나다 순)
    '가락동', '가산동', '가양동', '갈현동', '개봉동', '개포동', '거여동', '공덕동', '공릉동', '구의동', '군자동', '길동', '내곡동', '노량진동', '논현동', '대림동', '대방동', '대치동', '도곡동', '독산동', '둔촌동', '마곡동', '망원동', '면목동', '목동', '문정동', '미아동', '방배동', '방이동', '봉천동', '불광동', '사당동', '상계동', '상암동', '서교동', '서초동', '석관동', '석촌동', '성산동', '성수동', '세곡동', '수서동', '신림동', '신사동', '신오쿠보', '신정동', '신천동', '쌍문동', '아현동', '암사동', '압구정동', '양재동', '역삼동', '연남동', '연희동', '염창동', '영등포동', '오금동', '오류동', '옥수동', '우면동', '월계동', '을지로', '응암동', '이촌동', '이태원동', '일원동', '자양동', '잠실동', '잠원동', '장안동', '장지동', '전농동', '정릉동', '중계동', '중곡동', '천호동', '청담동', '청량리', '평창동', '풍납동', '한남동', '합정동', '행당동', '혜화동', '홍은동', '홍제동', '화곡동', '화양동', '휘경동', '흑석동',
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

interface Location {
    name: string;
    lat: number;
    lng: number;
}

const geoCache = new Map<string, { lat: number, lng: number }>();

const getGeoForLocation = async (locName: string): Promise<{ lat: number, lng: number } | null> => {
    if (geoCache.has(locName)) {
        return geoCache.get(locName)!;
    }

    try {
        const geoResponse = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
            params: {
                address: locName + ', 대한민국',
                key: GOOGLE_MAPS_API_KEY,
                language: 'ko'
            }
        });

        if (geoResponse.data.results && geoResponse.data.results.length > 0) {
            const { lat, lng } = geoResponse.data.results[0].geometry.location;
            const result = { lat, lng };
            geoCache.set(locName, result);
            return result;
        }
    } catch (error: any) {
        console.error(`Geocoding process error for location "${locName}":`, error.message);
    }
    return null;
};

const getAllLocationsFromText = async (title: string, description: string | null): Promise<Location[]> => {
    const textToSearch = `${title} ${description || ''}`;
    const foundLocations = LOCATION_KEYWORDS.filter(loc => textToSearch.includes(loc));

    const locations: Location[] = [];
    const processedQueries = new Set<string>();

    // Location lookups can technically run in parallel too, but since we have a cache,
    // we should just await them sequentially per article or use Promise.all.
    // Using Promise.all here is better.
    const promises = foundLocations.map(async (loc) => {
        if (processedQueries.has(loc)) return;
        processedQueries.add(loc);

        const geo = await getGeoForLocation(loc);
        if (geo) {
            locations.push({ name: loc, ...geo });
        }
    });

    await Promise.all(promises);

    if (locations.length === 0) {
        locations.push({ name: '서울', lat: 37.5665, lng: 126.9780 });
    }

    return locations;
};

const fetchNews = async (category: string, query: string) => {
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

        // Use Promise.all using map instead of for-loop
        const articles = await Promise.all(response.data.articles.map(async (article: any) => {
            const articleLocations = await getAllLocationsFromText(article.title, article.description);
            return {
                title: article.title,
                description: article.description,
                url: article.url,
                imageUrl: article.urlToImage,
                publishedAt: new Date(article.publishedAt),
                source: { name: article.source.name },
                category,
                locations: articleLocations,
            };
        }));

        return articles;
    } catch (error: any) {
        console.error(`Error fetching ${category} news:`, error.message);
        return [];
    }
};

const updateNews = async () => {
    console.log('Starting news update...');
    await connectDB();

    console.log('Clearing existing news articles...');
    try {
        await NewsArticle.deleteMany({});
        console.log('Existing news articles cleared.');
    } catch (error: any) {
        console.error('Error clearing existing news articles:', error.message);
    }

    // Clear cache at start of update
    geoCache.clear();

    console.log('Fetching news...');
    // Fetch categories in parallel
    const [entertainmentNews, travelNews, localNews] = await Promise.all([
        fetchNews('entertainment', 'k-pop'),
        fetchNews('travel', '경복궁'),
        fetchNews('local', '부산 국제 영화제')
    ]);

    const allNews = [...(entertainmentNews || []), ...(travelNews || []), ...(localNews || [])];

    if (allNews.length === 0) {
        console.log('No news fetched. Update process finished.');
        return { message: 'No news fetched', articleCount: 0 };
    }

    console.log(`Fetched ${allNews.length} articles. Saving to database...`);

    // Save in parallel (with limit if necessary, but for ~30 items Promise.all is fine)
    await Promise.all(allNews.map(async (articleData) => {
        try {
            await NewsArticle.updateOne({ url: articleData.url }, articleData, { upsert: true });
        } catch (error: any) {
            console.error(`Error saving article: ${articleData.title}`, error.message);
        }
    }));

    console.log('News update complete.');
    return { message: 'News update complete', articleCount: allNews.length };
};


export async function POST(req: NextRequest) {
    const authToken = (req.headers.get('authorization') || '').split('Bearer ').at(1);
    let isAdmin = false;

    // 1. Cron Secret 확인
    if (authToken === process.env.CRON_SECRET) {
        isAdmin = true;
    }
    // 2. Admin JWT 확인
    else if (authToken) {
        try {
            const decoded = jwt.verify(authToken, process.env.JWT_SECRET || 'your_jwt_secret') as any;
            // console.log('Decoded news update token:', decoded); // Debug log
            if (typeof decoded === 'object' && (decoded.role === 'admin' || decoded.isAdmin === true || decoded.isAdmin === 'true')) {
                isAdmin = true;
            } else {
                console.log('Admin check failed. Decoded:', decoded);
            }
        } catch (error: any) {
            console.error('JWT Verification failed:', error.message);
            // 토큰이 유효하지 않으면 아무것도 하지 않음 (isAdmin은 false 유지)
        }
    }

    if (!isAdmin) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const result = await updateNews();
        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Error in news update cron job:', error);
        return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
    }
}
