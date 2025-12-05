import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { verifyAdmin } from '@/lib/auth';
import User from '@/models/User';
import connectDB from '@/lib/db';

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const admin = await verifyAdmin(req);
    if (!admin) {
        return NextResponse.json({ message: '권한이 없습니다.' }, { status: 403 });
    }

    try {
        await connectDB();
        const { id } = await params;
        const { username, password, isAdmin, points } = await req.json();
        const updateData: any = { username, isAdmin, points };

        if (password) {
            updateData.password = await bcrypt.hash(password, 10);
        }

        const updatedUser = await User.findByIdAndUpdate(id, updateData, {
            new: true,
        }).select('-password');

        if (!updatedUser) {
            return NextResponse.json(
                { message: '사용자를 찾을 수 없습니다.' },
                { status: 404 }
            );
        }
        return NextResponse.json({
            message: '사용자가 성공적으로 업데이트되었습니다.',
            user: updatedUser,
        });
    } catch (error) {
        console.error('Update user error:', error);
        return NextResponse.json({ message: '서버 오류' }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const admin = await verifyAdmin(req);
    if (!admin) {
        return NextResponse.json({ message: '권한이 없습니다.' }, { status: 403 });
    }

    try {
        await connectDB();
        const { id } = await params;
        const deletedUser = await User.findByIdAndDelete(id);
        if (!deletedUser) {
            return NextResponse.json(
                { message: '사용자를 찾을 수 없습니다.' },
                { status: 404 }
            );
        }
        return NextResponse.json({ message: '사용자가 성공적으로 삭제되었습니다.' });
    } catch (error) {
        console.error('Delete user error:', error);
        return NextResponse.json({ message: '서버 오류' }, { status: 500 });
    }
}
