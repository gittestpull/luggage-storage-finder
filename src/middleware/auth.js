const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded.isAdmin) return res.status(403).send({ error: '관리자 권한이 필요합니다.' });
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).send({ error: '인증이 필요합니다.' });
    }
};

module.exports = auth;
