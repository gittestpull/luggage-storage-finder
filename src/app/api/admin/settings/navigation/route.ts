import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import SiteSetting from '@/models/SiteSetting';
import { headers } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(req: Request) {
    await dbConnect();

    try {
        // Auth Check
        const headersList = await headers();
        const token = headersList.get('authorization')?.split(' ')[1];

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        try {
            jwt.verify(token, JWT_SECRET);
        } catch (err) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const body = await req.json();

        // Validate/Sanitize body if needed, but for now we trust the admin sends correct boolean structure
        // We expect { showNews: boolean, ... }

        const setting = await SiteSetting.findOneAndUpdate(
            { key: 'navigation_config' },
            { value: body },
            { new: true, upsert: true }
        );

        return NextResponse.json(setting.value);

    } catch (error) {
        console.error('Error updating navigation settings:', error);
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }
}
