const express = require('express');
const WrongCardModel = require('../models/WrongCard');
const { auth } = require('../middlewares/auth');

const router = express.Router();

router.get('/', auth, async (req, res) => {
    try {
        const { page, pageSize } = req.query;
        
        const result = await WrongCardModel.getList(req.user.id, {
            page: parseInt(page) || 1,
            pageSize: parseInt(pageSize) || 10
        });

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Get wrong cards error:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '获取错题列表失败'
        });
    }
});

router.get('/stats', auth, async (req, res) => {
    try {
        const stats = await WrongCardModel.getStats(req.user.id);

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Get wrong cards stats error:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '获取错题统计失败'
        });
    }
});

router.post('/:cardId/master', auth, async (req, res) => {
    try {
        await WrongCardModel.markAsMastered(req.user.id, req.params.cardId);

        res.json({
            success: true,
            message: '已标记为掌握'
        });
    } catch (error) {
        console.error('Mark as mastered error:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '操作失败'
        });
    }
});

router.post('/:cardId/unmaster', auth, async (req, res) => {
    try {
        await WrongCardModel.markAsUnmastered(req.user.id, req.params.cardId);

        res.json({
            success: true,
            message: '已标记为未掌握'
        });
    } catch (error) {
        console.error('Mark as unmastered error:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '操作失败'
        });
    }
});

router.delete('/:cardId', auth, async (req, res) => {
    try {
        const deleted = await WrongCardModel.delete(req.user.id, req.params.cardId);

        if (!deleted) {
            return res.status(404).json({
                success: false,
                code: 404,
                message: '错题不存在'
            });
        }

        res.json({
            success: true,
            message: '删除成功'
        });
    } catch (error) {
        console.error('Delete wrong card error:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '删除失败'
        });
    }
});

module.exports = router;
