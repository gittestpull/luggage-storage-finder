import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { RecommendedStock } from '@/models/RecommendedStock';

export async function POST(request: Request) {
    try {
        await connectDB();
        const body = await request.json();

        const newStock = await RecommendedStock.create(body);

        return NextResponse.json(newStock, { status: 201 });
    } catch (error) {
        console.error('Failed to create recommended stock:', error);
        return NextResponse.json(
            { error: 'Failed to create recommended stock' },
            { status: 500 }
        );
    }
}
