const jwt = require('jsonwebtoken');

const optionalAuth = (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // 토큰이 유효하면 req.user에 디코딩된 정보 저장
        next();
    } catch (err) {
        // 토큰이 없거나 유효하지 않아도 오류를 발생시키지 않고 다음으로 넘어감
        next();
    }
};

module.exports = optionalAuth;
