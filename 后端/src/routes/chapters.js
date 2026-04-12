const express = require('express');
const ChapterModel = require('../models/Chapter');
const { auth } = require('../middlewares/auth');

const router = express.Router();

router.get('/:id', async (req, res) => {
    try {
        const chapter = await ChapterModel.findById(req.params.id);

        if (!chapter) {
            return res.status(404).json({
                success: false,
                code: 404,
                message: '章节不存在'
            });
        }

        res.json({
            success: true,
            data: chapter
        });
    } catch (error) {
        console.error('Get chapter error:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '获取章节详情失败'
        });
    }
});

router.put('/:id', auth, async (req, res) => {
    try {
        const chapter = await ChapterModel.findById(req.params.id);
        
        if (!chapter) {
            return res.status(404).json({
                success: false,
                code: 404,
                message: '章节不存在'
            });
        }

        const { name, sort_order } = req.body;
        const updated = await ChapterModel.update(req.params.id, {
            name,
            sort_order
        });

        res.json({
            success: true,
            data: updated
        });
    } catch (error) {
        console.error('Update chapter error:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '更新章节失败'
        });
    }
});

router.delete('/:id', auth, async (req, res) => {
    try {
        await ChapterModel.delete(req.params.id);

        res.json({
            success: true,
            message: '删除成功'
        });
    } catch (error) {
        console.error('Delete chapter error:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '删除章节失败'
        });
    }
});

router.get('/:id/cards', async (req, res) => {
    try {
        const cards = await ChapterModel.getCards(req.params.id);

        res.json({
            success: true,
            data: cards
        });
    } catch (error) {
        console.error('Get chapter cards error:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '获取章节卡片失败'
        });
    }
});

module.exports = router;
