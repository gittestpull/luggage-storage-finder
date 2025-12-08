import { NextRequest, NextResponse } from 'next/server';
import AccessLog from '@/models/AccessLog';
import connectDB from '@/lib/db';

export async function POST(req: NextRequest) {
    try {
        await connectDB();

        const body = await req.json();
        const ip = req.headers.get('x-forwarded-for') ||
            req.headers.get('x-real-ip') ||
            'unknown';
        const userAgent = req.headers.get('user-agent') || 'unknown';
        const referer = req.headers.get('referer') || 'direct';

        await AccessLog.create({
            path: body.path || '/admin',
            ip,
            userAgent,
            referer,
            method: body.action || 'unknown',
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Honeypot log error:', error);
        return NextResponse.json({ success: true }); // Always return success to not reveal it's a honeypot
    }
}
