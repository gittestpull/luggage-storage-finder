const isAdmin = (req, res, next) => {
    if (req.user && req.user.isAdmin) {
        next();
    } else {
        res.status(403).send({ error: '관리자 권한이 필요합니다.' });
    }
};

module.exports = isAdmin;
