import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { NewsArticle } from '@/models';
import { analyzeStockKeywords } from '@/lib/stockAnalysis';

export async function GET() {
    try {
        await dbConnect();

        // Find articles
        const articles = await NewsArticle.find().sort({ publishedAt: -1 }).limit(20);

        const updatedArticles = [];

        // Check and populate relatedStocks (Lazy Migration)
        for (const article of articles) {
            if (!article.relatedStocks || article.relatedStocks.length === 0) {
                // Perform AI analysis
                const recommendations = analyzeStockKeywords(article.title, article.description);

                // Update in DB
                article.relatedStocks = recommendations;
                await article.save();
            }
            updatedArticles.push(article);
        }

        return NextResponse.json(updatedArticles);
    } catch (error) {
        console.error('Error fetching news:', error);
        return NextResponse.json({ message: '서버 오류' }, { status: 500 });
    }
}
