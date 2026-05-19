const express = require('express');
const LibraryModel = require('../models/Library');
const ChapterModel = require('../models/Chapter');
const CardModel = require('../models/Card');
const FavoriteModel = require('../models/Favorite');
const LikeModel = require('../models/Like');
const MessageModel = require('../models/message');
const { auth, optionalAuth, adminAuth } = require('../middlewares/auth');

const router = express.Router();

router.get('/', optionalAuth, async (req, res) => {
    try {
        const { page, pageSize, subject, keyword } = req.query;
        
        const result = await LibraryModel.getList({
            page: parseInt(page) || 1,
            pageSize: parseInt(pageSize) || 10,
            subject,
            keyword,
            userId: req.user?.id
        });

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Get libraries error:', error);
        console.error('Stack:', error.stack);
        res.status(500).json({
            success: false,
            code: 500,
            message: '获取知识库列表失败'
        });
    }
});

router.get('/my', auth, async (req, res) => {
    try {
        const { page, pageSize } = req.query;
        
        const result = await LibraryModel.getMyLibraries(req.user.id, {
            page: parseInt(page) || 1,
            pageSize: parseInt(pageSize) || 10
        });

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Get my libraries error:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '获取我的知识库失败'
        });
    }
});

router.get('/recommended', async (req, res) => {
    try {
        const { limit } = req.query;
        const libraries = await LibraryModel.getRecommended(parseInt(limit) || 6);

        res.json({
            success: true,
            data: libraries
        });
    } catch (error) {
        console.error('Get recommended libraries error:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '获取推荐知识库失败'
        });
    }
});

router.get('/search', optionalAuth, async (req, res) => {
    try {
        const { keyword, page, pageSize } = req.query;

        if (!keyword) {
            return res.status(400).json({
                success: false,
                code: 400,
                message: '搜索关键词不能为空'
            });
        }

        const result = await LibraryModel.getList({
            keyword,
            page: parseInt(page) || 1,
            pageSize: parseInt(pageSize) || 10,
            userId: req.user?.id
        });

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Search libraries error:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '搜索失败'
        });
    }
});

router.get('/categories', async (req, res) => {
    try {
        const categories = await LibraryModel.getCategories();

        res.json({
            success: true,
            data: categories
        });
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '获取分类失败'
        });
    }
});

router.get('/:id', optionalAuth, async (req, res) => {
    try {
        const library = await LibraryModel.findById(req.params.id, req.user?.id);
        
        if (!library) {
            return res.status(404).json({
                success: false,
                code: 404,
                message: '知识库不存在'
            });
        }

        await LibraryModel.incrementViewCount(req.params.id);

        const chapters = await ChapterModel.getTree(req.params.id);

        res.json({
            success: true,
            data: {
                ...library,
                chapters
            }
        });
    } catch (error) {
        console.error('Get library error:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '获取知识库详情失败'
        });
    }
});

router.post('/', auth, async (req, res) => {
    try {
        const { name, subject, description, cover_image, is_public } = req.body;

        if (!name || !subject) {
            return res.status(400).json({
                success: false,
                code: 400,
                message: '知识库名称和学科不能为空'
            });
        }

        const library = await LibraryModel.create({
            name,
            subject,
            description,
            cover_image,
            created_by: req.user.id,
            is_public
        });

        res.status(201).json({
            success: true,
            data: library
        });
    } catch (error) {
        console.error('Create library error:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '创建知识库失败'
        });
    }
});

router.put('/:id', auth, async (req, res) => {
    try {
        const library = await LibraryModel.findById(req.params.id);
        
        if (!library) {
            return res.status(404).json({
                success: false,
                code: 404,
                message: '知识库不存在'
            });
        }

        if (library.created_by !== req.user.id) {
            return res.status(403).json({
                success: false,
                code: 403,
                message: '无权修改此知识库'
            });
        }

        const { name, subject, description, cover_image, is_public } = req.body;
        const updated = await LibraryModel.update(req.params.id, {
            name,
            subject,
            description,
            cover_image,
            is_public
        });

        res.json({
            success: true,
            data: updated
        });
    } catch (error) {
        console.error('Update library error:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '更新知识库失败'
        });
    }
});

router.delete('/:id', auth, async (req, res) => {
    try {
        const library = await LibraryModel.findById(req.params.id);
        
        if (!library) {
            return res.status(404).json({
                success: false,
                code: 404,
                message: '知识库不存在'
            });
        }

        if (library.created_by !== req.user.id) {
            return res.status(403).json({
                success: false,
                code: 403,
                message: '无权删除此知识库'
            });
        }

        await LibraryModel.delete(req.params.id);

        res.json({
            success: true,
            message: '删除成功'
        });
    } catch (error) {
        console.error('Delete library error:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '删除知识库失败'
        });
    }
});

router.post('/:id/favorite', auth, async (req, res) => {
    try {
        const result = await FavoriteModel.toggle(req.user.id, 'library', req.params.id);

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

router.post('/:id/like', auth, async (req, res) => {
    try {
        const library = await LibraryModel.findById(req.params.id);
        
        if (!library) {
            return res.status(404).json({
                success: false,
                code: 404,
                message: '知识库不存在'
            });
        }

        const result = await LikeModel.toggle(req.user.id, 'library', req.params.id);
        await LibraryModel.updateLikeCount(req.params.id, result.likeCount);

        res.json({
            success: true,
            data: { likeCount: result.likeCount, isLiked: result.isLiked }
        });
    } catch (error) {
        console.error('Like library error:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '点赞失败'
        });
    }
});

router.post('/:id/unlike', auth, async (req, res) => {
    try {
        const library = await LibraryModel.findById(req.params.id);
        
        if (!library) {
            return res.status(404).json({
                success: false,
                code: 404,
                message: '知识库不存在'
            });
        }

        const result = await LikeModel.toggle(req.user.id, 'library', req.params.id);
        await LibraryModel.updateLikeCount(req.params.id, result.likeCount);

        res.json({
            success: true,
            data: { likeCount: result.likeCount, isLiked: result.isLiked }
        });
    } catch (error) {
        console.error('Unlike library error:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '取消点赞失败'
        });
    }
});

router.get('/:libraryId/chapters', async (req, res) => {
    try {
        const chapters = await ChapterModel.getList(req.params.libraryId);

        res.json({
            success: true,
            data: chapters
        });
    } catch (error) {
        console.error('Get chapters error:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '获取章节列表失败'
        });
    }
});

router.post('/:libraryId/chapters', auth, async (req, res) => {
    try {
        const library = await LibraryModel.findById(req.params.libraryId);
        
        if (!library) {
            return res.status(404).json({
                success: false,
                code: 404,
                message: '知识库不存在'
            });
        }

        if (library.created_by !== req.user.id) {
            return res.status(403).json({
                success: false,
                code: 403,
                message: '无权操作'
            });
        }

        const { name, sort_order } = req.body;
        const chapter = await ChapterModel.create({
            library_id: req.params.libraryId,
            name,
            sort_order
        });

        res.status(201).json({
            success: true,
            data: chapter
        });
    } catch (error) {
        console.error('Create chapter error:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '创建章节失败'
        });
    }
});

router.get('/:libraryId/cards/random', async (req, res) => {
    try {
        const card = await CardModel.getRandom(req.params.libraryId);

        if (!card) {
            return res.status(404).json({
                success: false,
                code: 404,
                message: '没有找到卡片'
            });
        }

        res.json({
            success: true,
            data: {
                ...card,
                tags: card.tags ? JSON.parse(card.tags) : []
            }
        });
    } catch (error) {
        console.error('Get random card error:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '获取随机卡片失败'
        });
    }
});

router.get('/admin/pending', adminAuth, async (req, res) => {
    try {
        const { page, pageSize } = req.query;
        
        const result = await LibraryModel.getPendingList({
            page: parseInt(page) || 1,
            pageSize: parseInt(pageSize) || 10
        });

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('获取待审核知识库列表失败:', error);
        res.status(500).json({ success: false, code: 500, message: '获取待审核知识库列表失败' });
    }
});

router.post('/admin/:id/approve', adminAuth, async (req, res) => {
    try {
        const { note } = req.body;
        const library = await LibraryModel.findById(req.params.id);
        
        if (!library) {
            return res.status(404).json({ success: false, code: 404, message: '知识库不存在' });
        }

        if (library.status !== 'pending') {
            return res.status(400).json({ success: false, code: 400, message: '该知识库不在待审核状态' });
        }

        const updated = await LibraryModel.approve(req.params.id, req.user.id, note || '');
        
        res.json({
            success: true,
            data: updated,
            message: '审核通过'
        });
    } catch (error) {
        console.error('审核通过失败:', error);
        res.status(500).json({ success: false, code: 500, message: '审核通过失败' });
    }
});

router.post('/admin/:id/reject', adminAuth, async (req, res) => {
    try {
        const { note } = req.body;
        const library = await LibraryModel.findById(req.params.id);
        
        if (!library) {
            return res.status(404).json({ success: false, code: 404, message: '知识库不存在' });
        }

        if (library.status !== 'pending') {
            return res.status(400).json({ success: false, code: 400, message: '该知识库不在待审核状态' });
        }

        const updated = await LibraryModel.reject(req.params.id, req.user.id, note || '');
        
        try {
            await MessageModel.create({
                user_id: library.created_by,
                title: '知识库审核结果通知',
                content: `您提交的知识库「${library.name}」审核未通过。${note ? `原因：${note}` : ''}`,
                type: 'system'
            });
        } catch (msgError) {
            console.error('发送审核通知失败:', msgError);
        }
        
        res.json({
            success: true,
            data: updated,
            message: '审核驳回'
        });
    } catch (error) {
        console.error('审核驳回失败:', error);
        res.status(500).json({ success: false, code: 500, message: '审核驳回失败' });
    }
});

router.get('/admin/:id/review-history', adminAuth, async (req, res) => {
    try {
        const history = await LibraryModel.getReviewHistory(req.params.id);
        
        res.json({
            success: true,
            data: history
        });
    } catch (error) {
        console.error('获取审核历史失败:', error);
        res.status(500).json({ success: false, code: 500, message: '获取审核历史失败' });
    }
});

module.exports = router;
