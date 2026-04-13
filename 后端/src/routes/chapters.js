const express = require('express');
const ChapterModel = require('../models/Chapter');
const { auth } = require('../middlewares/auth');

const router = express.Router();

router.post('/batch', auth, async (req, res) => {
    try {
        const { libraryId, chapters } = req.body;
        
        if (!libraryId || !chapters || !Array.isArray(chapters)) {
            return res.status(400).json({
                success: false,
                code: 400,
                message: '参数不完整'
            });
        }

        const result = await ChapterModel.batchCreate(libraryId, chapters);

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Batch create chapters error:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '批量创建章节失败'
        });
    }
});

router.post('/batch-update', auth, async (req, res) => {
    try {
        const { libraryId, chapters } = req.body;
        
        if (!libraryId || !chapters || !Array.isArray(chapters)) {
            return res.status(400).json({
                success: false,
                code: 400,
                message: '参数不完整'
            });
        }

        const result = await ChapterModel.batchUpdate(libraryId, chapters);

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Batch update chapters error:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '批量更新章节失败'
        });
    }
});

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

        const { name, sort_order, parent_id, level } = req.body;
        const updated = await ChapterModel.update(req.params.id, {
            name,
            sort_order,
            parent_id,
            level
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
