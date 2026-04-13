const express = require('express');
const CardModel = require('../models/Card');
const StudyModel = require('../models/Study');
const CommentModel = require('../models/Comment');
const WrongCardModel = require('../models/WrongCard');
const FavoriteModel = require('../models/Favorite');
const LikeModel = require('../models/Like');
const MasteryModel = require('../models/Mastery');
const { auth, optionalAuth } = require('../middlewares/auth');

const router = express.Router();

router.get('/', optionalAuth, async (req, res) => {
    try {
        const { page, pageSize, library_id, libraryId, chapter_id, chapterId } = req.query;
        
        const result = await CardModel.getList({
            page: parseInt(page) || 1,
            pageSize: parseInt(pageSize) || 10,
            libraryId: library_id || libraryId,
            chapterId: chapter_id || chapterId,
            userId: req.user?.id
        });

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Get cards error:', error);
        console.error('Stack:', error.stack);
        res.status(500).json({
            success: false,
            code: 500,
            message: '获取卡片列表失败'
        });
    }
});

router.get('/hot', optionalAuth, async (req, res) => {
    try {
        const { limit } = req.query;
        const cards = await CardModel.getHotCards(parseInt(limit) || 10, req.user?.id);

        res.json({
            success: true,
            data: cards
        });
    } catch (error) {
        console.error('Get hot cards error:', error);
        console.error('Stack:', error.stack);
        res.status(500).json({
            success: false,
            code: 500,
            message: '获取热门卡片失败'
        });
    }
});

router.get('/search', async (req, res) => {
    try {
        const { keyword, page, pageSize } = req.query;
        
        if (!keyword) {
            return res.status(400).json({
                success: false,
                code: 400,
                message: '搜索关键词不能为空'
            });
        }

        const result = await CardModel.search(keyword, {
            page: parseInt(page) || 1,
            pageSize: parseInt(pageSize) || 10
        });

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Search cards error:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '搜索失败'
        });
    }
});

router.get('/:id', optionalAuth, async (req, res) => {
    try {
        const card = await CardModel.findById(req.params.id, req.user?.id);
        
        if (!card) {
            return res.status(404).json({
                success: false,
                code: 404,
                message: '卡片不存在'
            });
        }

        res.json({
            success: true,
            data: card
        });
    } catch (error) {
        console.error('Get card error:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '获取卡片详情失败'
        });
    }
});

router.post('/', auth, async (req, res) => {
    try {
        const { library_id, chapter_id, question, answer, tags, is_public } = req.body;

        if (!library_id || !question || !answer) {
            return res.status(400).json({
                success: false,
                code: 400,
                message: '知识库ID、问题和答案不能为空'
            });
        }

        const card = await CardModel.create({
            library_id,
            chapter_id,
            question,
            answer,
            tags,
            created_by: req.user.id,
            is_public
        });

        res.status(201).json({
            success: true,
            data: card
        });
    } catch (error) {
        console.error('Create card error:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '创建卡片失败'
        });
    }
});

router.put('/:id', auth, async (req, res) => {
    try {
        const card = await CardModel.findById(req.params.id);
        
        if (!card) {
            return res.status(404).json({
                success: false,
                code: 404,
                message: '卡片不存在'
            });
        }

        if (card.created_by !== req.user.id) {
            return res.status(403).json({
                success: false,
                code: 403,
                message: '无权修改此卡片'
            });
        }

        const { question, answer, tags, chapter_id, is_public } = req.body;
        const updated = await CardModel.update(req.params.id, {
            question,
            answer,
            tags,
            chapter_id,
            is_public
        });

        res.json({
            success: true,
            data: updated
        });
    } catch (error) {
        console.error('Update card error:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '更新卡片失败'
        });
    }
});

router.delete('/:id', auth, async (req, res) => {
    try {
        const card = await CardModel.findById(req.params.id);
        
        if (!card) {
            return res.status(404).json({
                success: false,
                code: 404,
                message: '卡片不存在'
            });
        }

        if (card.created_by !== req.user.id) {
            return res.status(403).json({
                success: false,
                code: 403,
                message: '无权删除此卡片'
            });
        }

        await CardModel.delete(req.params.id);

        res.json({
            success: true,
            message: '删除成功'
        });
    } catch (error) {
        console.error('Delete card error:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '删除卡片失败'
        });
    }
});

router.get('/:id/next', async (req, res) => {
    try {
        const card = await CardModel.findById(req.params.id);
        
        if (!card) {
            return res.status(404).json({
                success: false,
                code: 404,
                message: '卡片不存在'
            });
        }

        const nextCard = await CardModel.getNext(req.params.id, card.library_id);

        res.json({
            success: true,
            data: nextCard
        });
    } catch (error) {
        console.error('Get next card error:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '获取下一张卡片失败'
        });
    }
});

router.get('/:id/prev', async (req, res) => {
    try {
        const card = await CardModel.findById(req.params.id);
        
        if (!card) {
            return res.status(404).json({
                success: false,
                code: 404,
                message: '卡片不存在'
            });
        }

        const prevCard = await CardModel.getPrev(req.params.id, card.library_id);

        res.json({
            success: true,
            data: prevCard
        });
    } catch (error) {
        console.error('Get prev card error:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '获取上一张卡片失败'
        });
    }
});

router.post('/:id/study', auth, async (req, res) => {
    try {
        const card = await CardModel.findById(req.params.id);
        
        if (!card) {
            return res.status(404).json({
                success: false,
                code: 404,
                message: '卡片不存在'
            });
        }

        const { feedback, duration } = req.body;
        
        await StudyModel.recordStudy(
            req.user.id,
            req.params.id,
            card.library_id,
            feedback || 'normal',
            duration || 0
        );
        
        await CardModel.incrementStudyCount(req.params.id);

        res.json({
            success: true,
            message: '学习记录已保存'
        });
    } catch (error) {
        console.error('Record study error:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '记录学习失败'
        });
    }
});

router.post('/:id/wrong', auth, async (req, res) => {
    try {
        const result = await WrongCardModel.add(req.user.id, req.params.id);

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Add wrong card error:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '添加错题失败'
        });
    }
});

router.post('/:id/master', auth, async (req, res) => {
    try {
        await WrongCardModel.markAsMastered(req.user.id, req.params.id);

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

router.post('/:id/like', auth, async (req, res) => {
    try {
        const card = await CardModel.findById(req.params.id);
        
        if (!card) {
            return res.status(404).json({
                success: false,
                code: 404,
                message: '卡片不存在'
            });
        }

        const result = await LikeModel.toggle(req.user.id, 'card', req.params.id);
        await CardModel.updateLikeCount(req.params.id, result.likeCount);

        res.json({
            success: true,
            data: { likeCount: result.likeCount, isLiked: result.isLiked }
        });
    } catch (error) {
        console.error('Like card error:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '点赞失败'
        });
    }
});

router.post('/:id/unlike', auth, async (req, res) => {
    try {
        const card = await CardModel.findById(req.params.id);
        
        if (!card) {
            return res.status(404).json({
                success: false,
                code: 404,
                message: '卡片不存在'
            });
        }

        const result = await LikeModel.toggle(req.user.id, 'card', req.params.id);
        await CardModel.updateLikeCount(req.params.id, result.likeCount);

        res.json({
            success: true,
            data: { likeCount: result.likeCount, isLiked: result.isLiked }
        });
    } catch (error) {
        console.error('Unlike card error:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '取消点赞失败'
        });
    }
});

router.get('/:cardId/comments', async (req, res) => {
    try {
        const { page, pageSize } = req.query;
        
        const result = await CommentModel.getList(req.params.cardId, {
            page: parseInt(page) || 1,
            pageSize: parseInt(pageSize) || 10
        });

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Get comments error:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '获取评论失败'
        });
    }
});

router.post('/:cardId/comments', auth, async (req, res) => {
    try {
        const { content } = req.body;

        if (!content || content.trim() === '') {
            return res.status(400).json({
                success: false,
                code: 400,
                message: '评论内容不能为空'
            });
        }

        const comment = await CommentModel.create(req.params.cardId, req.user.id, content);

        res.status(201).json({
            success: true,
            data: comment
        });
    } catch (error) {
        console.error('Create comment error:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '发表评论失败'
        });
    }
});

router.post('/:id/mastery', auth, async (req, res) => {
    try {
        const card = await CardModel.findById(req.params.id);
        
        if (!card) {
            return res.status(404).json({
                success: false,
                code: 404,
                message: '卡片不存在'
            });
        }

        const { mastered } = req.body;
        const result = await MasteryModel.setMastery(
            req.user.id,
            req.params.id,
            card.library_id,
            mastered
        );

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Set mastery error:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '设置掌握状态失败'
        });
    }
});

router.post('/:id/mastery/toggle', auth, async (req, res) => {
    try {
        const card = await CardModel.findById(req.params.id);
        
        if (!card) {
            return res.status(404).json({
                success: false,
                code: 404,
                message: '卡片不存在'
            });
        }

        const result = await MasteryModel.toggle(
            req.user.id,
            req.params.id,
            card.library_id
        );

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Toggle mastery error:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '切换掌握状态失败'
        });
    }
});

module.exports = router;
