import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import PushSubscription from '@/models/PushSubscription';
import { sendPushNotification } from '@/lib/push';

const MONGODB_URI = process.env.MONGODB_URI || '';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { subscriptionId, title, body: messageBody, url } = body;

        if (!subscriptionId || !title || !messageBody) {
            return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
        }

        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(MONGODB_URI);
        }

        const subscription = await PushSubscription.findById(subscriptionId);
        if (!subscription) {
            return NextResponse.json({ message: 'Subscription not found' }, { status: 404 });
        }

        const payload = {
            title,
            body: messageBody,
            data: { url: url || '/' },
            icon: '/icon-192x192.png'
        };

        const result = await sendPushNotification(subscription, payload);

        if (result.success) {
            return NextResponse.json({ message: 'Notification sent' });
        } else {
            return NextResponse.json({ message: 'Failed to send (subscription might be expired)' }, { status: 410 });
        }
    } catch (error) {
        console.error('Error sending individual push:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
