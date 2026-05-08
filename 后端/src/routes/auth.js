const express = require('express');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/User');

const router = express.Router();

router.post('/qq-login', async (req, res) => {
    try {
        const { code, redirectUri, accessToken: clientAccessToken, openId: clientOpenId } = req.body;

        const qqAppId = process.env.QQ_APP_ID;
        const qqAppKey = process.env.QQ_APP_KEY;

        if (!qqAppId || !qqAppKey) {
            return res.status(500).json({
                success: false,
                code: 500,
                message: 'QQ登录未配置'
            });
        }

        let accessToken = clientAccessToken;
        let openid = clientOpenId;

        if (!accessToken || !openid) {
            if (!code) {
                return res.status(400).json({
                    success: false,
                    code: 400,
                    message: '缺少授权信息'
                });
            }

            const tokenResponse = await fetch(
                `https://graph.qq.com/oauth2.0/token?grant_type=authorization_code&client_id=${qqAppId}&client_secret=${qqAppKey}&code=${code}&redirect_uri=${encodeURIComponent(redirectUri)}`
            );
            const tokenText = await tokenResponse.text();
            
            const tokenParams = new URLSearchParams(tokenText);
            accessToken = tokenParams.get('access_token');

            if (!accessToken) {
                return res.status(400).json({
                    success: false,
                    code: 400,
                    message: '获取access_token失败'
                });
            }

            const openidResponse = await fetch(
                `https://graph.qq.com/oauth2.0/me?access_token=${accessToken}`
            );
            const openidText = await openidResponse.text();
            
            const openidMatch = openidText.match(/"openid":"([^"]+)"/);
            if (openidMatch) {
                openid = openidMatch[1];
            }

            if (!openid) {
                return res.status(400).json({
                    success: false,
                    code: 400,
                    message: '获取openid失败'
                });
            }
        }

        const userInfoResponse = await fetch(
            `https://graph.qq.com/user/get_user_info?access_token=${accessToken}&oauth_consumer_key=${qqAppId}&openid=${openid}`
        );
        const userInfo = await userInfoResponse.json();

        const qqOpenid = 'qq_' + openid;
        let user = await UserModel.findByOpenid(qqOpenid);
        
        if (!user) {
            user = await UserModel.create({
                openid: qqOpenid,
                nickname: userInfo.nickname || 'QQ用户',
                avatar: userInfo.figureurl_qq_2 || userInfo.figureurl_qq_1 || userInfo.figureurl_2 || '',
                gender: userInfo.gender === '男' ? 1 : (userInfo.gender === '女' ? 2 : 0)
            });
        } else {
            if (userInfo.nickname && user.nickname === 'QQ用户') {
                await UserModel.update(user.id, {
                    nickname: userInfo.nickname,
                    avatar: userInfo.figureurl_qq_2 || userInfo.figureurl_qq_1 || user.avatar
                });
                user = await UserModel.findById(user.id);
            }
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
                    userId: user.user_id,
                    nickname: user.nickname,
                    avatar: user.avatar,
                    bio: user.bio
                }
            }
        });
    } catch (error) {
        console.error('QQ login error:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: 'QQ登录失败'
        });
    }
});

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
                    userId: user.user_id,
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
            let user = await UserModel.findByOpenid('test_openid');
            
            if (!user) {
                user = await UserModel.create({
                    openid: 'test_openid',
                    nickname: '测试用户',
                    avatar: 'https://via.placeholder.com/100',
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
                        userId: user.user_id,
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
                        userId: user.user_id,
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
                userId: user.user_id,
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
            const checkResult = await UserModel.canUpdateNickname(req.user.id);
            if (!checkResult.canUpdate) {
                return res.status(400).json({
                    success: false,
                    code: 400,
                    message: `昵称修改需要间隔30天，还需等待${checkResult.remainingDays}天`,
                    data: { remainingDays: checkResult.remainingDays }
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

router.get('/profile/nickname-check', require('../middlewares/auth').auth, async (req, res) => {
    try {
        const result = await UserModel.canUpdateNickname(req.user.id);
        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Check nickname error:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '检查失败'
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
