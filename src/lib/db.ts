import mongoose from 'mongoose';

declare global {
    // eslint-disable-next-line no-var
    var mongoose: { conn: mongoose.Mongoose | null; promise: Promise<mongoose.Mongoose> | null } | undefined;
}

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable inside .env');
}

let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect(): Promise<mongoose.Mongoose> {
    if (cached!.conn) {
        return cached!.conn;
    }

    if (!cached!.promise) {
        cached!.promise = mongoose.connect(MONGODB_URI!, { bufferCommands: false }).then((mongoose) => {
            console.log('MongoDB 연결 성공');
            return mongoose;
        });
    }

    try {
        cached!.conn = await cached!.promise;
    } catch (e) {
        cached!.promise = null;
        throw e;
    }

    return cached!.conn;
}

export default dbConnect;
