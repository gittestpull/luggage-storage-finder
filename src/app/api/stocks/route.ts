
import { NextResponse } from 'next/server';
import { fetchStockInfo } from '@/lib/stockClient';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
        return NextResponse.json({ error: 'Stock code is required' }, { status: 400 });
    }

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
