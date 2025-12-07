import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { NewsArticle } from '@/models/NewsArticle';

export async function GET() {
    try {
        await dbConnect();
        const articles = await NewsArticle.find().sort({ publishedAt: -1 }).limit(20);
        return NextResponse.json(articles);
    } catch (error) {
        console.error('Error fetching news:', error);
        return NextResponse.json({ message: '서버 오류' }, { status: 500 });
    }
}
