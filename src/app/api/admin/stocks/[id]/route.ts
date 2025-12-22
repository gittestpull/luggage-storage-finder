import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { RecommendedStock } from '@/models/RecommendedStock';

export async function DELETE(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        const params = await props.params;
        const { id } = params;

        const deletedStock = await RecommendedStock.findByIdAndDelete(id);

        if (!deletedStock) {
            return NextResponse.json(
                { error: 'Stock not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ message: 'Stock deleted successfully' });
    } catch (error) {
        console.error('Failed to delete recommended stock:', error);
        return NextResponse.json(
            { error: 'Failed to delete recommended stock' },
            { status: 500 }
        );
    }
}
