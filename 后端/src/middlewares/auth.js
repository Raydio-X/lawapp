const jwt = require('jsonwebtoken');
const UserModel = require('../models/User');

const auth = async (req, res, next) => {
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
        
        const user = await UserModel.findById(decoded.id);
        if (!user) {
            return res.status(401).json({
                success: false,
                code: 401,
                message: '用户不存在，请重新登录'
            });
        }
        
        req.user = {
            id: user.id,
            openid: user.openid,
            role: user.role || 'user'
        };
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

const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key');
            
            const user = await UserModel.findById(decoded.id);
            if (user) {
                req.user = {
                    id: user.id,
                    openid: user.openid,
                    role: user.role || 'user'
                };
            }
        }
        
        next();
    } catch (error) {
        next();
    }
};

const adminAuth = async (req, res, next) => {
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
        
        const user = await UserModel.findById(decoded.id);
        if (!user) {
            return res.status(401).json({
                success: false,
                code: 401,
                message: '用户不存在，请重新登录'
            });
        }
        
        if (user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                code: 403,
                message: '无管理员权限'
            });
        }
        
        req.user = {
            id: user.id,
            openid: user.openid,
            role: 'admin'
        };
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
