
import { NextResponse } from 'next/server';
import { fetchStockInfo } from '@/lib/stockClient';
import { connectDB } from '@/lib/db';
import { RecommendedStock } from '@/models/RecommendedStock';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    // If no code is provided, return all recommended stocks
    if (!code) {
        try {
            await connectDB();

            // 1. Admin Recommended Stocks
            const adminStocks = await RecommendedStock.find({}).sort({ createdAt: -1 });

            // 2. News-based AI Recommendations
            // Fetch recent news that have related stocks
            const recentNews = await import('@/models/NewsArticle').then(m =>
                m.NewsArticle.find({
                    'relatedStocks.0': { $exists: true }
                })
                    .sort({ publishedAt: -1 })
                    .limit(20)
                    .lean()
            );

            const newsStocks: any[] = [];

            // Extract stocks from news
            recentNews.forEach(article => {
                if (article.relatedStocks && Array.isArray(article.relatedStocks)) {
                    article.relatedStocks.forEach((stock: any) => {
                        newsStocks.push({
                            _id: `news-${stock.code}-${article._id}`, // Temporary ID
                            name: stock.name,
                            code: stock.code,
                            description: `[AI 추천] ${article.title}\n\n${stock.reason}`,
                            createdAt: article.publishedAt,
                            isAi: true // Flag to identify AI recommendations if needed
                        });
                    });
                }
            });

            // 3. Merge and Deduplicate (Admin stocks take precedence)
            const stockMap = new Map();

            // Add Admin stocks first
            adminStocks.forEach(stock => {
                stockMap.set(stock.code, stock);
            });

            // Add News stocks if not already present
            newsStocks.forEach(stock => {
                if (!stockMap.has(stock.code)) {
                    stockMap.set(stock.code, stock);
                }
            });

            // Convert to array and sort by date (newest first)
            const combinedStocks = Array.from(stockMap.values()).sort((a, b) => {
                const dateA = new Date(a.createdAt).getTime();
                const dateB = new Date(b.createdAt).getTime();
                return dateB - dateA;
            });

            return NextResponse.json(combinedStocks);
        } catch (error) {
            console.error('Failed to fetch recommended stocks:', error);
            return NextResponse.json(
                { error: 'Failed to fetch recommended stocks' },
                { status: 500 }
            );
        }
    }

    // Existing logic for fetching specific stock info
    try {
        const stockData = await fetchStockInfo(code);

        if (!stockData) {
            return NextResponse.json({ error: 'Failed to fetch stock data' }, { status: 404 });
        }

        return NextResponse.json(stockData);
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
