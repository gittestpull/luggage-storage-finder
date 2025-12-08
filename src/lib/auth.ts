import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import User from '@/models/User';
import connectDB from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

export async function verifyAdmin(req: NextRequest) {
    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return null;
        }

        const token = authHeader.split(' ')[1];
        const decoded: any = jwt.verify(token, JWT_SECRET);

        if (!decoded.isAdmin) {
            return null;
        }

        await connectDB();
        const user = await User.findById(decoded.userId);
        if (!user || !user.isAdmin) {
            return null;
        }

        return user;
    } catch (error) {
        return null;
    }
}
