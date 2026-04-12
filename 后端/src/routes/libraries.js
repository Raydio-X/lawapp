const express = require('express');
const LibraryModel = require('../models/Library');
const ChapterModel = require('../models/Chapter');
const CardModel = require('../models/Card');
const FavoriteModel = require('../models/Favorite');
const { auth, optionalAuth } = require('../middlewares/auth');

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
        const library = await LibraryModel.findById(req.params.id);
        
        if (!library) {
            return res.status(404).json({
                success: false,
                code: 404,
                message: '知识库不存在'
            });
        }

        await LibraryModel.incrementViewCount(req.params.id);

        const chapters = await ChapterModel.getList(req.params.id);

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

router.post('/:id/like', async (req, res) => {
    try {
        const library = await LibraryModel.findById(req.params.id);
        
        if (!library) {
            return res.status(404).json({
                success: false,
                code: 404,
                message: '知识库不存在'
            });
        }

        const likeCount = await LibraryModel.incrementLikeCount(req.params.id);

        res.json({
            success: true,
            data: { likeCount, isLiked: true }
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

router.post('/:id/unlike', async (req, res) => {
    try {
        const library = await LibraryModel.findById(req.params.id);
        
        if (!library) {
            return res.status(404).json({
                success: false,
                code: 404,
                message: '知识库不存在'
            });
        }

        const likeCount = await LibraryModel.decrementLikeCount(req.params.id);

        res.json({
            success: true,
            data: { likeCount, isLiked: false }
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

module.exports = router;
