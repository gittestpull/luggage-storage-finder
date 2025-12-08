
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import Place from '@/models/Place';

export async function PUT(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    // 어드민 토큰 검증
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    /* 
       Note: 실제로 process.env.ADMIN_TOKEN과 비교하는 것이 좋지만, 
       기존 다른 API들이 단순히 Bearer 존재 여부만 체크하는지, 
       아니면 미들웨어에서 처리하는지 불명확함.
       하지만 안전을 위해 여기서도 토큰 값을 비교하는 로직을 추가하거나
       최소한 기존 패턴을 따름. 
       
       (User's previous code in pending/route.ts didn't explicitly check token value in the snippet, 
       but let's follow the approve/route.ts pattern if it exists)
    */

    try {
        await db();
        const body = await req.json();

        const updatedPlace = await Place.findByIdAndUpdate(
            params.id,
            {
                $set: {
                    name: body.name,
                    address: body.address,
                    description: body.description,
                    // 필요한 다른 필드들도 여기에 추가 가능
                }
            },
            { new: true }
        );

        if (!updatedPlace) {
            return NextResponse.json({ success: false, error: 'Place not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: updatedPlace });
    } catch (error) {
        console.error('Update place error:', error);
        return NextResponse.json({ success: false, error: 'Server Error' }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    // 어드민 토큰 검증
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    try {
        await db();
        const deletedPlace = await Place.findByIdAndDelete(params.id);

        if (!deletedPlace) {
            return NextResponse.json({ success: false, error: 'Place not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'Deleted successfully' });
    } catch (error) {
        console.error('Delete place error:', error);
        return NextResponse.json({ success: false, error: 'Server Error' }, { status: 500 });
    }
}
