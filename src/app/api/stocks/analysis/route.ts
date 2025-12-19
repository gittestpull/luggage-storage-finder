import { NextResponse } from 'next/server';
import { fetchStockAnalysis } from '@/lib/stockClient';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
        return NextResponse.json({ error: 'Stock code is required' }, { status: 400 });
    }

    try {
        const analysisData = await fetchStockAnalysis(code);
        return NextResponse.json(analysisData);
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
