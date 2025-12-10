
// Simulated AI Stock Analysis
// This mocks an AI that analyzes text and returns related stock information.

interface StockInfo {
    name: string;
    code: string;
    keywords: string[];
}

// Database of stocks and their keywords
const STOCK_DATABASE: StockInfo[] = [
    { name: '삼성전자', code: '005930', keywords: ['삼성', '반도체', '갤럭시', '스마트폰', 'AI', '전자'] },
    { name: 'SK하이닉스', code: '000660', keywords: ['SK', '하이닉스', '메모리', '칩', '반도체'] },
    { name: '현대차', code: '005380', keywords: ['현대', '자동차', '전기차', '모빌리티', '수소'] },
    { name: '대한항공', code: '003490', keywords: ['항공', '여행', '비행기', '공항', '운송', '해외'] },
    { name: '하나투어', code: '039130', keywords: ['여행', '패키지', '관광', '투어', '휴가'] },
    { name: '하이브', code: '352820', keywords: ['BTS', '뉴진스', '엔터', '공연', '음악', '케이팝'] },
    { name: 'JYP Ent.', code: '035900', keywords: ['JYP', '트와이스', '가수', '엔터'] },
    { name: 'NAVER', code: '035420', keywords: ['네이버', '포털', '검색', '웹툰', '라인'] },
    { name: '카카오', code: '035720', keywords: ['카카오', '메신저', '톡', '플랫폼'] },
    { name: 'CJ ENM', code: '035760', keywords: ['방송', '영화', '드라마', 'CJ', '콘텐츠'] },
    { name: '호텔신라', code: '008770', keywords: ['호텔', '면세점', '쇼핑', '관광'] },
    { name: '아모레퍼시픽', code: '090430', keywords: ['화장품', '뷰티', '미용', '쇼핑'] },
    { name: '이마트', code: '139480', keywords: ['마트', '쇼핑', '유통', '식품'] },
];

export interface RecommendedStock {
    name: string;
    code: string;
    reason: string;
}

/**
 * Analyzes the text (title + description) and returns recommended stocks.
 * Simulates an AI analysis process.
 */
export function analyzeStockKeywords(title: string, description: string): RecommendedStock[] {
    const text = `${title} ${description}`.toLowerCase();
    const recommendations: RecommendedStock[] = [];

    STOCK_DATABASE.forEach(stock => {
        // Check if any keyword exists in the text
        const matchedKeyword = stock.keywords.find(keyword => text.includes(keyword.toLowerCase()));

        if (matchedKeyword) {
            recommendations.push({
                name: stock.name,
                code: stock.code,
                reason: `'${matchedKeyword}' 키워드 관련 종목 (AI 분석)`
            });
        }
    });

    // If no specific match, assign a random 'Market Leader' for demo purposes if it's empty
    // so the UI isn't empty.
    if (recommendations.length === 0) {
        // Simple heuristic based on category words if available, otherwise random
        if (text.includes('여행') || text.includes('관광')) {
             recommendations.push({ name: '모두투어', code: '080160', reason: '여행 산업 관련 추천' });
        } else if (text.includes('연예') || text.includes('방송')) {
             recommendations.push({ name: '스튜디오드래곤', code: '253450', reason: '엔터테인먼트 섹터 추천' });
        } else {
             // Fallback
             recommendations.push({ name: 'KODEX 200', code: '069500', reason: '시장 대표 지수 ETF' });
        }
    }

    // Limit to 3 recommendations
    return recommendations.slice(0, 3);
}

export interface StockMarketData {
    price: number;
    change: number;
    changePercent: number;
    isUp: boolean;
}

/**
 * Generates dummy real-time data for a stock.
 * The price is somewhat randomized around a base price derived from the code to stay consistent-ish.
 */
export function getMockStockData(code: string): StockMarketData {
    // Generate a consistent base price from the code
    const basePrice = (parseInt(code) % 500) * 1000 + 10000;

    // Random fluctuation +/- 5%
    const randomFactor = 1 + (Math.random() * 0.1 - 0.05);
    const currentPrice = Math.floor(basePrice * randomFactor);

    // Calculate change
    const prevPrice = basePrice;
    const change = currentPrice - prevPrice;
    const changePercent = (change / prevPrice) * 100;

    return {
        price: currentPrice,
        change: Math.floor(Math.abs(change)),
        changePercent: Math.abs(parseFloat(changePercent.toFixed(2))),
        isUp: change >= 0
    };
}
