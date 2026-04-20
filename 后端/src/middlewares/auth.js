const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                code: 401,
                message: '未登录或登录已过期'
            });
        }

        const token = authHeader.split(' ')[1];
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key');
        req.user = decoded;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                code: 401,
                message: '登录已过期，请重新登录'
            });
        }
        
        return res.status(401).json({
            success: false,
            code: 401,
            message: '无效的登录凭证'
        });
    }
};

const optionalAuth = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key');
            req.user = decoded;
        }
        
        next();
    } catch (error) {
        next();
    }
};

const adminAuth = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                code: 401,
                message: '未登录或登录已过期'
            });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key');
        
        if (decoded.role !== 'admin') {
            return res.status(403).json({
                success: false,
                code: 403,
                message: '无管理员权限'
            });
        }
        
        req.user = decoded;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                code: 401,
                message: '登录已过期，请重新登录'
            });
        }
        
        return res.status(401).json({
            success: false,
            code: 401,
            message: '无效的登录凭证'
        });
    }
};

module.exports = { auth, optionalAuth, adminAuth };
