import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import SiteSetting from '@/models/SiteSetting';

export const dynamic = 'force-dynamic';

export async function GET() {
    await dbConnect();

    try {
        let setting = await SiteSetting.findOne({ key: 'navigation_config' });

        if (!setting) {
            // Default settings
            const defaultSettings = {
                showHome: true,
                showNews: true,
                showStocks: true,
                showPlaces: true,
                showFun: true,
                showFaq: true,
                showPush: true,
            };
            // Create default if not exists
            setting = await SiteSetting.create({
                key: 'navigation_config',
                value: defaultSettings,
            });
        }

        return NextResponse.json(setting.value);
    } catch (error) {
        console.error('Error fetching navigation settings:', error);
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }
}
