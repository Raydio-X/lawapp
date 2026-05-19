const express = require('express');
const ActivationCodeModel = require('../models/ActivationCode');
const UserModel = require('../models/User');
const db = require('../config/database');
const { auth } = require('../middlewares/auth');

const router = express.Router();

router.post('/activate', auth, async (req, res) => {
    try {
        const { code } = req.body;
        
        if (!code) {
            return res.status(400).json({
                success: false,
                message: '请输入激活码'
            });
        }

        const codeData = await ActivationCodeModel.useCode(code, req.user.id);
        
        await UserModel.activateVIP(req.user.id, codeData.duration_days);
        
        const updatedUser = await UserModel.findById(req.user.id);

        res.json({
            success: true,
            message: '激活成功',
            data: {
                is_vip: updatedUser.is_vip,
                vip_expires_at: updatedUser.vip_expires_at
            }
        });
    } catch (error) {
        console.error('激活失败:', error);
        res.status(400).json({
            success: false,
            message: error.message || '激活失败'
        });
    }
});

router.get('/status', auth, async (req, res) => {
    try {
        const user = await UserModel.findById(req.user.id);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }

        const isVIP = await UserModel.checkVIPStatus(req.user.id);

        res.json({
            success: true,
            data: {
                is_vip: isVIP,
                vip_expires_at: user.vip_expires_at
            }
        });
    } catch (error) {
        console.error('获取VIP状态失败:', error);
        res.status(500).json({
            success: false,
            message: '获取VIP状态失败'
        });
    }
});

router.get('/history', auth, async (req, res) => {
    try {
        const { page = 1, pageSize = 20 } = req.query;
        
        const result = await ActivationCodeModel.getList({
            page,
            pageSize,
            isUsed: 1
        });

        const history = result.list
            .filter(item => item.used_by === req.user.id)
            .map(item => ({
                ...item,
                status: 'success'
            }));

        res.json({
            success: true,
            data: {
                list: history,
                total: history.length,
                hasMore: false
            }
        });
    } catch (error) {
        console.error('获取激活历史失败:', error);
        res.status(500).json({
            success: false,
            message: '获取激活历史失败'
        });
    }
});

router.get('/batch-import/check', auth, async (req, res) => {
    try {
        const isVIP = await UserModel.checkVIPStatus(req.user.id);
        
        if (isVIP) {
            return res.json({
                success: true,
                data: {
                    is_vip: true,
                    can_batch_import: true,
                    remaining: -1,
                    limit: -1,
                    used: 0
                }
            });
        }
        
        const today = new Date().toISOString().split('T')[0];
        
        const [statsRows] = await db.execute(
            'SELECT batch_import_count, batch_import_date FROM user_stats WHERE user_id = ?',
            [req.user.id]
        );
        
        let used = 0;
        if (statsRows.length > 0 && statsRows[0].batch_import_date === today) {
            used = statsRows[0].batch_import_count || 0;
        }
        
        const limit = 3;
        const remaining = Math.max(0, limit - used);
        
        res.json({
            success: true,
            data: {
                is_vip: false,
                can_batch_import: remaining > 0,
                remaining,
                limit,
                used
            }
        });
    } catch (error) {
        console.error('检查批量导入权限失败:', error);
        res.status(500).json({
            success: false,
            message: '检查批量导入权限失败'
        });
    }
});

module.exports = router;
