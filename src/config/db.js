const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/luggage-storage', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('MongoDB 연결 성공');
    } catch (err) {
        console.error('MongoDB 연결 실패:', err);
        process.exit(1); // 연결 실패 시 프로세스 종료
    }
};

module.exports = connectDB;
