const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');


// --- 데이터베이스 연결 ---
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('MongoDB에 성공적으로 연결되었습니다.');
    createAdmin();
}).catch(err => {
    console.error('MongoDB 연결 실패:', err);
    process.exit(1);
});

// --- User 스키마 및 모델 정의 (app.js와 동일) ---
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isAdmin: { type: Boolean, default: false },
    points: { type: Number, default: 0 }
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

// --- 관리자 계정 생성 함수 ---
async function createAdmin() {
    const ADMIN_USERNAME = 'admin';
    const ADMIN_PASSWORD = 'password123';

    try {
        const existingAdmin = await User.findOne({ username: ADMIN_USERNAME });
        if (existingAdmin) {
            console.log(`이미 관리자 계정('${ADMIN_USERNAME}')이 존재합니다.`);
            return;
        }

        const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
        const adminUser = new User({
            username: ADMIN_USERNAME,
            password: hashedPassword,
            isAdmin: true
        });

        await adminUser.save();
        console.log(`관리자 계정('${ADMIN_USERNAME}' / '${ADMIN_PASSWORD}')이 성공적으로 생성되었습니다.`);
        console.log('보안을 위해 이 스크립트(create-admin.js)는 이제 삭제하셔도 좋습니다.');

    } catch (error) {
        console.error('관리자 계정 생성 중 오류 발생:', error);
    } finally {
        // 연결 종료
        mongoose.connection.close().then(() => {
            console.log('MongoDB 연결이 종료되었습니다.');
        });
    }
}
