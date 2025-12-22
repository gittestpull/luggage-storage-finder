import { NextResponse } from 'next/server';
import { fetchMarketIndices } from '@/lib/stockClient';

export async function GET() {
    try {
        const indices = await fetchMarketIndices();
        return NextResponse.json(indices);
    } catch (error) {
        console.error('Failed to fetch market indices:', error);
        return NextResponse.json({ error: 'Failed to fetch indices' }, { status: 500 });
    }
}
