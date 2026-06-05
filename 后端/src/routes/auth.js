const express = require('express');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/User');
const db = require('../config/database');

const router = express.Router();

router.post('/qq-login', async (req, res) => {
    try {
        const { code, redirectUri, accessToken: clientAccessToken, openId: clientOpenId, platform, unionId: clientUnionId } = req.body;

        // 根据平台选择不同的APP配置
        const isMobile = platform === 'mobile';
        let qqAppId, qqAppKey;
        
        if (isMobile) {
            qqAppId = process.env.QQ_MOBILE_APP_ID || process.env.QQ_APP_ID;
            qqAppKey = process.env.QQ_MOBILE_APP_KEY || process.env.QQ_APP_KEY;
        } else {
            qqAppId = process.env.QQ_WEB_APP_ID || process.env.QQ_APP_ID;
            qqAppKey = process.env.QQ_WEB_APP_KEY || process.env.QQ_APP_KEY;
        }

        if (!qqAppId || !qqAppKey) {
            return res.status(500).json({
                success: false,
                code: 500,
                message: 'QQ登录未配置'
            });
        }

        let accessToken = clientAccessToken;
        let openid = clientOpenId;
        let unionidFromToken = null;

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

            // 获取openid的同时获取unionid（加 unionid=1 参数）
            const openidResponse = await fetch(
                `https://graph.qq.com/oauth2.0/me?access_token=${accessToken}&unionid=1&fmt=json`
            );
            const openidText = await openidResponse.text();
            
            let openidData;
            try {
                openidData = JSON.parse(openidText);
            } catch (e) {
                // JSONP格式，尝试提取
                const openidMatch = openidText.match(/"openid":"([^"]+)"/);
                if (openidMatch) {
                    openidData = { openid: openidMatch[1] };
                }
                const unionidMatch = openidText.match(/"unionid":"([^"]+)"/);
                if (unionidMatch) {
                    openidData = openidData || {};
                    openidData.unionid = unionidMatch[1];
                }
            }
            
            if (openidData) {
                openid = openidData.openid;
                unionidFromToken = openidData.unionid || null;
                
                if (openidData.error) {
                    console.error('获取openid/unionid错误:', openidData.error, openidData.error_description);
                }
            }

            if (!openid) {
                return res.status(400).json({
                    success: false,
                    code: 400,
                    message: '获取openid失败'
                });
            }
        }

        // 优先使用前端传递的 unionId，其次使用获取openid时返回的 unionid，最后尝试单独获取
        let unionid = clientUnionId || unionidFromToken || null;
        
        if (!unionid && accessToken) {
            try {
                // 单独请求获取UnionID
                const unionidUrl = `https://graph.qq.com/oauth2.0/me?access_token=${accessToken}&unionid=1&fmt=json`;
                const unionidResponse = await fetch(unionidUrl);
                const unionidText = await unionidResponse.text();
                
                let unionidData;
                try {
                    unionidData = JSON.parse(unionidText);
                } catch (e) {
                    // JSONP格式提取
                    const unionidMatch = unionidText.match(/"unionid":"([^"]+)"/);
                    if (unionidMatch) {
                        unionidData = { unionid: unionidMatch[1] };
                    } else {
                        throw new Error('无法解析UnionID响应');
                    }
                }
                
                if (unionidData.error) {
                    console.error('UnionID API返回错误:', unionidData.error, unionidData.error_description);
                } else {
                    unionid = unionidData.unionid;
                }
            } catch (error) {
                console.error('获取unionId失败:', error.message);
            }
        }

        const userInfoResponse = await fetch(
            `https://graph.qq.com/user/get_user_info?access_token=${accessToken}&oauth_consumer_key=${qqAppId}&openid=${openid}`
        );
        const userInfo = await userInfoResponse.json();

        // 优先使用 unionId 作为用户标识，如果没有则使用 openId
        const userIdentifier = unionid ? `qq_union_${unionid}` : `qq_${openid}`;
        
        let user = await UserModel.findByOpenid(userIdentifier);
        
        // 如果通过 unionId 找不到，尝试通过 openId 查找（兼容旧数据）
        if (!user && !unionid) {
            user = await UserModel.findByOpenid(`qq_${openid}`);
        }
        
        // 如果用户存在，尝试通过旧的 openid 迁移到 unionid
        if (!user && unionid) {
            const oldUser = await UserModel.findByOpenid(`qq_${openid}`);
            if (oldUser) {
                await db.execute('UPDATE users SET openid = ?, unionid = ? WHERE id = ?', [userIdentifier, unionid, oldUser.id]);
                user = await UserModel.findById(oldUser.id);
            }
        }
        
        if (!user) {
            user = await UserModel.create({
                openid: userIdentifier,
                unionid: unionid,
                nickname: userInfo.nickname || 'QQ用户',
                avatar: userInfo.figureurl_qq_2 || userInfo.figureurl_qq_1 || userInfo.figureurl_2 || '',
                gender: userInfo.gender === '男' ? 1 : (userInfo.gender === '女' ? 2 : 0)
            });
        } else {
            // 每次登录都更新用户信息（昵称、头像和unionid）
            const newNickname = userInfo.nickname || user.nickname;
            const newAvatar = userInfo.figureurl_qq_2 || userInfo.figureurl_qq_1 || userInfo.figureurl_2 || user.avatar;
            
            const updateData = {};
            if (newNickname !== user.nickname) {
                updateData.nickname = newNickname;
            }
            if (newAvatar !== user.avatar) {
                updateData.avatar = newAvatar;
            }
            if (unionid && unionid !== user.unionid) {
                updateData.unionid = unionid;
            }
            
            if (Object.keys(updateData).length > 0) {
                await UserModel.update(user.id, updateData);
                user = await UserModel.findById(user.id);
            }
        }

        // 最终确认：如果获取到了unionid但数据库中仍为空，强制更新
        if (unionid && user && !user.unionid) {
            try {
                await db.execute('UPDATE users SET unionid = ? WHERE id = ?', [unionid, user.id]);
                user = await UserModel.findById(user.id);
            } catch (dbError) {
                console.error('强制更新unionid失败:', dbError.message);
                // 可能是UNIQUE约束冲突，尝试查找并合并重复用户
                if (dbError.code === 'ER_DUP_ENTRY') {
                    const [duplicateUsers] = await db.execute('SELECT id FROM users WHERE unionid = ? AND id != ?', [unionid, user.id]);
                    if (duplicateUsers.length > 0) {
                        await db.execute('UPDATE users SET unionid = NULL WHERE id = ?', [duplicateUsers[0].id]);
                        await db.execute('UPDATE users SET unionid = ? WHERE id = ?', [unionid, user.id]);
                        user = await UserModel.findById(user.id);
                    }
                }
            }
        }

        const token = jwt.sign(
            { id: user.id, openid: user.openid, role: user.role || 'user' },
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
                    role: user.role || 'user'
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
            { id: user.id, openid: user.openid, role: user.role || 'user' },
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
                    role: user.role || 'user'
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
                    bio: '测试账号',
                    role: 'user'
                });
            }

            const token = jwt.sign(
                { id: user.id, openid: user.openid, role: user.role || 'user' },
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
                        role: user.role || 'user'
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
                    bio: '系统管理员',
                    role: 'admin'
                });
            }

            if (user.role !== 'admin') {
                await db.execute('UPDATE users SET role = ? WHERE id = ?', ['admin', user.id]);
                user = await UserModel.findById(user.id);
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
                role: user.role || 'user',
                isVip: user.is_vip || false,
                vipExpireAt: user.vip_expires_at,
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
