const express = require('express');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/User');

const router = express.Router();

router.post('/login', async (req, res) => {
    try {
        const { code, userInfo } = req.body;

        if (!code) {
            return res.status(400).json({
                success: false,
                code: 400,
                message: '缺少登录凭证'
            });
        }

        let openid;
        
        if (process.env.WECHAT_APPID && process.env.WECHAT_SECRET) {
            const wxResponse = await fetch(
                `https://api.weixin.qq.com/sns/jscode2session?appid=${process.env.WECHAT_APPID}&secret=${process.env.WECHAT_SECRET}&js_code=${code}&grant_type=authorization_code`
            );
            const wxData = await wxResponse.json();
            
            if (wxData.errcode) {
                return res.status(400).json({
                    success: false,
                    code: 400,
                    message: '微信登录失败: ' + wxData.errmsg
                });
            }
            
            openid = wxData.openid;
        } else {
            openid = 'mock_openid_' + code;
        }

        let user = await UserModel.findByOpenid(openid);
        
        if (!user) {
            user = await UserModel.create({
                openid,
                nickname: userInfo?.nickName || '微信用户',
                avatar: userInfo?.avatarUrl || '',
                gender: userInfo?.gender || 0
            });
        }

        const token = jwt.sign(
            { id: user.id, openid: user.openid },
            process.env.JWT_SECRET || 'your_jwt_secret_key',
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        res.json({
            success: true,
            data: {
                token,
                userInfo: {
                    id: user.id,
                    nickname: user.nickname,
                    avatar: user.avatar,
                    bio: user.bio
                }
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '登录失败'
        });
    }
});

router.post('/test-login', async (req, res) => {
    try {
        const { account, password } = req.body;

        if (account === 'test' && password === '123456') {
            let user = await UserModel.findByOpenid('test_account');
            
            if (!user) {
                user = await UserModel.create({
                    openid: 'test_account',
                    nickname: '测试用户',
                    avatar: '',
                    bio: '测试账号'
                });
            }

            const token = jwt.sign(
                { id: user.id, openid: user.openid, role: 'user' },
                process.env.JWT_SECRET || 'your_jwt_secret_key',
                { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
            );

            res.json({
                success: true,
                data: {
                    token,
                    userInfo: {
                        id: user.id,
                        nickname: user.nickname,
                        avatar: user.avatar,
                        bio: user.bio,
                        role: 'user'
                    }
                }
            });
        } else if (account === 'admin' && password === 'admin666') {
            let user = await UserModel.findByOpenid('admin_account');
            
            if (!user) {
                user = await UserModel.create({
                    openid: 'admin_account',
                    nickname: '管理员',
                    avatar: '',
                    bio: '系统管理员'
                });
            }

            const token = jwt.sign(
                { id: user.id, openid: user.openid, role: 'admin' },
                process.env.JWT_SECRET || 'your_jwt_secret_key',
                { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
            );

            res.json({
                success: true,
                data: {
                    token,
                    userInfo: {
                        id: user.id,
                        nickname: user.nickname,
                        avatar: user.avatar,
                        bio: user.bio,
                        role: 'admin'
                    }
                }
            });
        } else {
            res.status(401).json({
                success: false,
                code: 401,
                message: '账号或密码错误'
            });
        }
    } catch (error) {
        console.error('Test login error:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '登录失败'
        });
    }
});

router.get('/me', require('../middlewares/auth').auth, async (req, res) => {
    try {
        const user = await UserModel.findById(req.user.id);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                code: 404,
                message: '用户不存在'
            });
        }

        res.json({
            success: true,
            data: {
                id: user.id,
                nickname: user.nickname,
                avatar: user.avatar,
                bio: user.bio,
                phone: user.phone,
                gender: user.gender,
                createdAt: user.created_at
            }
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '获取用户信息失败'
        });
    }
});

router.put('/profile', require('../middlewares/auth').auth, async (req, res) => {
    try {
        const { nickname, avatar, bio, phone, gender } = req.body;
        
        if (nickname) {
            const existingUser = await UserModel.findByNickname(nickname);
            if (existingUser && existingUser.id !== req.user.id) {
                return res.status(400).json({
                    success: false,
                    code: 400,
                    message: '该昵称已被使用'
                });
            }
        }
        
        const user = await UserModel.update(req.user.id, {
            nickname,
            avatar,
            bio,
            phone,
            gender
        });

        res.json({
            success: true,
            data: {
                id: user.id,
                nickname: user.nickname,
                avatar: user.avatar,
                bio: user.bio,
                phone: user.phone,
                gender: user.gender
            }
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '更新失败'
        });
    }
});

router.post('/refresh', require('../middlewares/auth').auth, async (req, res) => {
    try {
        const token = jwt.sign(
            { id: req.user.id, openid: req.user.openid },
            process.env.JWT_SECRET || 'your_jwt_secret_key',
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        res.json({
            success: true,
            data: { token }
        });
    } catch (error) {
        console.error('Refresh token error:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '刷新Token失败'
        });
    }
});

module.exports = router;
