const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/User'); // User 모델 경로 수정

// .env 파일 로드
require('dotenv').config();

// MongoDB 연결
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('MongoDB에 성공적으로 연결되었습니다.');
    createUser();
}).catch(err => {
    console.error('MongoDB 연결 실패:', err);
    process.exit(1);
});

async function createUser() {
    const username = process.argv[2];
    const password = process.argv[3];

    if (!username || !password) {
        console.log('사용법: node create-user.js <username> <password>');
        mongoose.connection.close();
        return;
    }

    try {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            console.log(`사용자 '${username}'이(가) 이미 존재합니다.`);
            mongoose.connection.close();
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            username,
            password: hashedPassword,
            isAdmin: false // 일반 사용자
        });

        await newUser.save();
        console.log(`사용자 '${username}'이(가) 성공적으로 생성되었습니다.`);

    } catch (error) {
        console.error('사용자 생성 중 오류 발생:', error);
    } finally {
        mongoose.connection.close();
    }
}
