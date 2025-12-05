import { NextRequest, NextResponse } from 'next/server';
import PushSubscription from '@/models/PushSubscription';
import connectDB from '@/lib/db';

// 푸시 구독 등록/업데이트
export async function POST(req: NextRequest) {
    try {
        await connectDB();

        const subscription = await req.json();

        if (!subscription.endpoint || !subscription.keys) {
            return NextResponse.json(
                { message: '유효하지 않은 구독 정보입니다.' },
                { status: 400 }
            );
        }

        // 이미 존재하는 구독인지 확인 (endpoint 기준)
        const existingSubscription = await PushSubscription.findOne({
            endpoint: subscription.endpoint
        });

        if (existingSubscription) {
            // 기존 구독 업데이트
            existingSubscription.keys = subscription.keys;
            existingSubscription.expirationTime = subscription.expirationTime;
            await existingSubscription.save();
            console.log('기존 푸시 구독 업데이트됨:', existingSubscription.endpoint);
            return NextResponse.json({
                message: '푸시 구독이 업데이트되었습니다.',
                subscriptionId: existingSubscription._id
            });
        } else {
            // 새 구독 저장
            const newSubscription = new PushSubscription({
                endpoint: subscription.endpoint,
                expirationTime: subscription.expirationTime,
                keys: subscription.keys,
            });
            await newSubscription.save();
            console.log('새 푸시 구독 저장됨:', newSubscription.endpoint);
            return NextResponse.json({
                message: '푸시 구독이 성공적으로 등록되었습니다.',
                subscriptionId: newSubscription._id
            }, { status: 201 });
        }
    } catch (error: any) {
        console.error('푸시 구독 저장 실패:', error);
        return NextResponse.json(
            { message: '푸시 구독 등록에 실패했습니다.', error: error.message },
            { status: 500 }
        );
    }
}

// 구독 정보 조회 (디버깅용)
export async function GET() {
    try {
        await connectDB();
        const count = await PushSubscription.countDocuments();
        return NextResponse.json({
            message: '푸시 구독 현황',
            totalSubscriptions: count
        });
    } catch (error: any) {
        return NextResponse.json(
            { message: '구독 정보 조회 실패', error: error.message },
            { status: 500 }
        );
    }
}
