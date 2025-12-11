import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import PushSubscription from '@/models/PushSubscription';
import { sendPushNotification } from '@/lib/push';

const MONGODB_URI = process.env.MONGODB_URI || '';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { subscriptionIds, title, body: messageBody, url } = body;

        if (!subscriptionIds || !Array.isArray(subscriptionIds) || subscriptionIds.length === 0 || !title || !messageBody) {
            return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
        }

        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(MONGODB_URI);
        }

        const subscriptions = await PushSubscription.find({ _id: { $in: subscriptionIds } });
        if (!subscriptions || subscriptions.length === 0) {
            return NextResponse.json({ message: 'No subscriptions found' }, { status: 404 });
        }

        const payload = {
            title,
            body: messageBody,
            data: { url: url || '/' },
            icon: '/icon-192x192.png'
        };

        const results = await Promise.all(
            subscriptions.map(sub => sendPushNotification(sub, payload))
        );

        const successCount = results.filter(r => r.success).length;
        const failureCount = results.length - successCount;

        return NextResponse.json({
            message: 'Bulk push process completed',
            successCount,
            failureCount
        });

    } catch (error) {
        console.error('Error sending bulk push:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
