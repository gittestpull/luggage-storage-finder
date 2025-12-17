
import { NextResponse } from 'next/server';
import { fetchMarketIndices } from '@/lib/stockClient';

export const dynamic = 'force-dynamic'; // Always fetch fresh
export const revalidate = 60; // Cache for 60 seconds

export async function GET() {
    try {
        const indices = await fetchMarketIndices();
        return NextResponse.json(indices);
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
