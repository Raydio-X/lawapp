const express = require('express');
const FavoriteModel = require('../models/Favorite');
const { auth } = require('../middlewares/auth');

const router = express.Router();

router.get('/', auth, async (req, res) => {
    try {
        const { page, pageSize, type } = req.query;
        
        const result = await FavoriteModel.getList(req.user.id, {
            page: parseInt(page) || 1,
            pageSize: parseInt(pageSize) || 10,
            type
        });

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Get favorites error:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '获取收藏列表失败'
        });
    }
});

router.post('/', auth, async (req, res) => {
    try {
        const { targetType, targetId } = req.body;

        if (!targetType || !targetId) {
            return res.status(400).json({
                success: false,
                code: 400,
                message: '参数不完整'
            });
        }

        const result = await FavoriteModel.add(req.user.id, targetType, targetId);

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Add favorite error:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '添加收藏失败'
        });
    }
});

router.delete('/', auth, async (req, res) => {
    try {
        const { targetType, targetId } = req.body;

        if (!targetType || !targetId) {
            return res.status(400).json({
                success: false,
                code: 400,
                message: '参数不完整'
            });
        }

        const removed = await FavoriteModel.remove(req.user.id, targetType, targetId);

        res.json({
            success: true,
            data: { removed }
        });
    } catch (error) {
        console.error('Remove favorite error:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '取消收藏失败'
        });
    }
});

router.get('/check', auth, async (req, res) => {
    try {
        const { targetType, targetId } = req.query;

        if (!targetType || !targetId) {
            return res.status(400).json({
                success: false,
                code: 400,
                message: '参数不完整'
            });
        }

        const isFavorited = await FavoriteModel.check(req.user.id, targetType, targetId);

        res.json({
            success: true,
            data: { isFavorited }
        });
    } catch (error) {
        console.error('Check favorite error:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '检查收藏状态失败'
        });
    }
});

router.post('/toggle', auth, async (req, res) => {
    try {
        const { targetType, targetId } = req.body;

        if (!targetType || !targetId) {
            return res.status(400).json({
                success: false,
                code: 400,
                message: '参数不完整'
            });
        }

        const result = await FavoriteModel.toggle(req.user.id, targetType, targetId);

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Toggle favorite error:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '操作失败'
        });
    }
});

module.exports = router;
