import * as cheerio from 'cheerio'; // Unused but keep for compatibility if needed later, or remove.
// Naver Mobile API is UTF-8 Standard.

export interface StockTrend {
    foreigner: number;
    institution: number;
    date: string;
}

export interface RealTimeStockData {
    symbol: string;
    price: number;
    change: number;
    changePercent: number;
    isUp: boolean;
    name?: string;
    trends?: StockTrend | null;
}

export async function fetchStockInfo(code: string): Promise<RealTimeStockData | null> {
    try {
        // Use Naver Mobile Internal API (JSON, UTF-8)
        // https://m.stock.naver.com/api/stock/005930/basic
        const url = `https://m.stock.naver.com/api/stock/${code}/basic`;

        const headers = {
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1'
        };

        const response = await fetch(url, {
            headers,
            next: { revalidate: 30 } // Cache for 30s
        });

        if (!response.ok) {
            throw new Error(`Naver API failed: ${response.status}`);
        }

        const data = await response.json();

        // Fetch Integration info for Investor trends
        const integrationUrl = `https://m.stock.naver.com/api/stock/${code}/integration`;
        const integrationRes = await fetch(integrationUrl, { headers, next: { revalidate: 60 } });
        const integrationData = await integrationRes.json();

        // Data format example:
        // {
        //   stockName: "삼성전자",
        //   itemCode: "005930",
        //   closePrice: "53,800",
        //   compareToPreviousClosePrice: "200", 
        //   fluctuationsRatio: "0.37", 
        //   compareToPreviousPrice: { code: "2", text: "상승", name: "RISING" } 
        // }

        if (!data || !data.closePrice) return null;

        // Parse Basic Data
        const closePrice = data.closePrice.replace(/,/g, '');
        const compareToPreviousClosePrice = data.compareToPreviousClosePrice.replace(/,/g, '');
        const fluctuationsRatio = data.fluctuationsRatio; // "-1.91"
        const stockName = data.stockName;

        const price = parseInt(closePrice, 10);
        const change = parseInt(compareToPreviousClosePrice, 10); // Can be negative
        const changePercent = parseFloat(fluctuationsRatio);
        const isUp = change >= 0;
        const name = stockName;

        // Parse Investor Data
        // dealTrendInfos: Array of { bizdate, foreignerPureBuyQuant, organPureBuyQuant, ... }
        // We take the latest available day (index 0)
        let trends = null;
        if (integrationData?.dealTrendInfos?.length > 0) {
            const today = integrationData.dealTrendInfos[0];
            trends = {
                foreigner: parseInt(today.foreignerPureBuyQuant.replace(/,/g, ''), 10),
                institution: parseInt(today.organPureBuyQuant.replace(/,/g, ''), 10),
                date: today.bizdate
            };
        }

        return {
            symbol: code,
            price,
            change,
            changePercent,
            isUp,
            name,
            trends // New field
        };

    } catch (error) {
        console.error(`Error fetching stock ${code}:`, error);
        return null;
    }
}

export interface MarketIndexData {
    name: string;
    value: string;
    change: string;
    changePercent: string;
    isUp: boolean;
}

export async function fetchMarketIndices(): Promise<MarketIndexData[]> {
    const indices: MarketIndexData[] = [];

    try {
        // 1. KOSPI & KOSDAQ (Naver)
        const [kospiRes, kosdaqRes, usdRes, btcRes] = await Promise.allSettled([
            fetch('https://m.stock.naver.com/api/index/KOSPI/basic'),
            fetch('https://m.stock.naver.com/api/index/KOSDAQ/basic'),
            fetch('https://m.stock.naver.com/front-api/marketIndex/productDetail?category=exchange&reutersCode=FX_USDKRW'),
            fetch('https://api.upbit.com/v1/ticker?markets=KRW-BTC')
        ]);

        // Helper to parse Naver Index
        const parseNaverIndex = async (res: PromiseSettledResult<Response>, name: string) => {
            if (res.status === 'fulfilled' && res.value.ok) {
                const data = await res.value.json();
                // Naver Index API: closePrice, compareToPreviousClosePrice, fluctuationsRatio
                const value = data.closePrice; // "2,544.12"
                const change = data.compareToPreviousClosePrice; // "-12.12"
                const percent = data.fluctuationsRatio + '%'; // "-0.45"
                const isUp = !change.startsWith('-');

                indices.push({ name, value, change, changePercent: percent, isUp });
            }
        };

        // Helper to parse Naver Exchange
        const parseNaverExchange = async (res: PromiseSettledResult<Response>, name: string) => {
            if (res.status === 'fulfilled' && res.value.ok) {
                const json = await res.value.json();
                const data = json.result; // Wrapper in 'result'
                // Naver Exchange: closePrice "1,350.50", fluctuations "5.00" (absolute usually), fluctuationsRatio "0.30"

                // Direction logic
                const isUp = data.fluctuationsType?.code === '2'; // 2=Rise, 5=Fall
                const sign = isUp ? '+' : (data.fluctuationsType?.code === '5' ? '-' : '');

                indices.push({
                    name,
                    value: data.closePrice,
                    change: `${sign}${data.fluctuations}`,
                    changePercent: `${sign}${data.fluctuationsRatio}%`,
                    isUp
                });
            }
        };

        // Helper to parse Upbit
        const parseUpbit = async (res: PromiseSettledResult<Response>, name: string) => {
            if (res.status === 'fulfilled' && res.value.ok) {
                const data = await res.value.json();
                const ticker = data[0]; // [{...}]
                // Upbit: trade_price, signed_change_price, signed_change_rate
                const price = ticker.trade_price.toLocaleString('ko-KR');
                const changePrice = ticker.signed_change_price.toLocaleString('ko-KR');
                const changeRate = (ticker.signed_change_rate * 100).toFixed(2) + '%';
                const isUp = ticker.signed_change_price > 0;

                // Add explicit sign for display consistency
                const sign = isUp ? '+' : '';

                indices.push({
                    name,
                    value: `${price}원`, // Upbit uses KRW
                    change: `${sign}${changePrice}`,
                    changePercent: `${sign}${changeRate}`,
                    isUp
                });
            }
        };

        await parseNaverIndex(kospiRes, 'KOSPI');
        await parseNaverIndex(kosdaqRes, 'KOSDAQ');
        await parseNaverExchange(usdRes, 'USD/KRW');
        await parseUpbit(btcRes, 'Bitcoin');
    } catch (e) {
        console.error('Error fetching indices', e);
    }

    return indices;
}

export interface StockAnalysisData {
    consensus: {
        opinion: string;
        targetPrice: number;
        sources: number;
    } | null;
    disclosures: {
        title: string;
        date: string;
        link: string;
    }[];
    relatedStocks: {
        code: string;
        name: string;
        price: string;
        changePercent: string;
    }[];
    news: {
        title: string;
        date: string;
        summary: string;
        link: string;
        thumbnail?: string;
    }[];
}

export async function fetchStockAnalysis(code: string): Promise<StockAnalysisData | null> {
    try {
        const headers = {
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1'
        };

        // Integration API (Consensus, Related), Disclosure API, News API
        const integrationUrl = `https://m.stock.naver.com/api/stock/${code}/integration`;
        const disclosureUrl = `https://m.stock.naver.com/api/stock/${code}/disclosure`;
        const newsUrl = `https://m.stock.naver.com/api/news/stock/${code}?pageSize=10`;

        const [intRes, discRes, newsRes] = await Promise.all([
            fetch(integrationUrl, { headers, next: { revalidate: 300 } }),
            fetch(disclosureUrl, { headers, next: { revalidate: 300 } }),
            fetch(newsUrl, { headers, next: { revalidate: 300 } })
        ]);

        const intData = await intRes.json();
        const discData = await discRes.json();
        const newsData = await newsRes.json();

        // Parse Consensus
        let consensus = null;
        if (intData?.consensusInfo) {
            consensus = {
                opinion: intData.consensusInfo.recommMean || 'N/A',
                targetPrice: parseInt((intData.consensusInfo.priceTargetMean || '0').replace(/,/g, ''), 10),
                sources: 0
            };
        }

        // Parse Related Stocks (Industry Compare)
        const relatedStocks = (intData?.industryCompareInfo || []).map((item: any) => ({
            code: item.itemCode,
            name: item.stockName,
            price: item.closePrice,
            changePercent: item.fluctuationsRatio + '%'
        }));

        // Parse Disclosures
        const refinedDisclosures = (Array.isArray(discData) ? discData : (discData?.disclosures || [])).slice(0, 5).map((item: any) => ({
            title: item.title,
            date: item.datetime,
            link: `https://m.stock.naver.com/domestic/stock/${code}/disclosure/view/${item.disclosureId}`
        }));

        // Parse News
        // News API returns array of objects, each containing 'items' array.
        // Usually result is like: [ { total: 1, items: [...] }, ... ] or just array of articles?
        // CLI output showed: [{"total":1,"items":[{...}]}]
        // We need to flatten this items structure.
        const articles: any[] = [];
        if (Array.isArray(newsData)) {
            newsData.forEach((group: any) => {
                if (group.items) articles.push(...group.items);
            });
        }

        const refinedNews = articles.slice(0, 10).map((item: any) => ({
            title: item.title,
            date: item.datetime, // "202511050800"
            summary: item.body,
            link: `https://m.stock.naver.com/investment/news/view/${item.officeId}/${item.articleId}`,
            thumbnail: item.imageOriginLink
        }));

        return {
            consensus,
            disclosures: refinedDisclosures,
            relatedStocks,
            news: refinedNews
        };

    } catch (e) {
        console.error('Error fetching analysis', e);
        return null;
    }
}
