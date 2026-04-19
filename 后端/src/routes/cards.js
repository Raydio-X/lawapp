const express = require('express');
const multer = require('multer');
const xlsx = require('xlsx');
const path = require('path');
const CardModel = require('../models/Card');
const ChapterModel = require('../models/Chapter');
const StudyModel = require('../models/Study');
const CommentModel = require('../models/Comment');
const FavoriteModel = require('../models/Favorite');
const LikeModel = require('../models/Like');
const MasteryModel = require('../models/Mastery');
const { auth, optionalAuth } = require('../middlewares/auth');

const router = express.Router();

const upload = multer({
    dest: path.join(__dirname, '../../uploads/temp/'),
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if (ext === '.xlsx' || ext === '.xls') {
            cb(null, true);
        } else {
            cb(new Error('只支持 .xlsx 和 .xls 格式的文件'));
        }
    },
    limits: { fileSize: 5 * 1024 * 1024 }
});

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

router.post('/batch-import', auth, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                code: 400,
                message: '请上传文件'
            });
        }

        const { library_id } = req.body;
        if (!library_id) {
            return res.status(400).json({
                success: false,
                code: 400,
                message: '请选择目标知识库'
            });
        }

        const workbook = xlsx.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });

        if (rows.length < 2) {
            return res.status(400).json({
                success: false,
                code: 400,
                message: '文件中没有数据行'
            });
        }

        const dataRows = rows.slice(1);
        const cards = [];
        const errors = [];

        for (let i = 0; i < dataRows.length; i++) {
            const row = dataRows[i];
            const question = row[0] ? String(row[0]).trim() : '';
            const answer = row[1] ? String(row[1]).trim() : '';
            const chapterName = row[2] ? String(row[2]).trim() : '';

            if (!question && !answer) continue;

            if (!question || !answer) {
                errors.push({
                    row: i + 2,
                    message: `第${i + 2}行：问题和答案不能为空`
                });
                continue;
            }

            cards.push({ question, answer, chapterName });
        }

        if (cards.length === 0) {
            return res.status(400).json({
                success: false,
                code: 400,
                message: errors.length > 0
                    ? `解析失败：${errors.map(e => e.message).join('；')}`
                    : '文件中没有有效的卡片数据'
            });
        }

        const preview = req.body.preview === 'true' || req.body.preview === true;

        if (preview) {
            return res.json({
                success: true,
                data: {
                    cards: cards.map((c, i) => ({
                        index: i + 1,
                        question: c.question,
                        answer: c.answer,
                        chapterName: c.chapterName || ''
                    })),
                    total: cards.length,
                    errors: errors
                }
            });
        }

        const chapterMap = {};
        const existingChapters = await ChapterModel.getList(library_id);
        existingChapters.forEach(ch => {
            chapterMap[ch.name] = ch.id;
        });

        let importedCount = 0;
        const importErrors = [];

        for (let i = 0; i < cards.length; i++) {
            const card = cards[i];
            try {
                let chapterId = null;
                if (card.chapterName) {
                    if (chapterMap[card.chapterName]) {
                        chapterId = chapterMap[card.chapterName];
                    } else {
                        const newChapter = await ChapterModel.create({
                            library_id,
                            name: card.chapterName,
                            sort_order: Object.keys(chapterMap).length,
                            level: 1
                        });
                        chapterMap[card.chapterName] = newChapter.id;
                        chapterId = newChapter.id;
                    }
                }

                await CardModel.create({
                    library_id: parseInt(library_id),
                    chapter_id: chapterId,
                    question: card.question,
                    answer: card.answer,
                    tags: [],
                    created_by: req.user.id,
                    is_public: 0
                });
                importedCount++;
            } catch (err) {
                importErrors.push({
                    row: i + 2,
                    question: card.question,
                    message: err.message || '导入失败'
                });
            }
        }

        const fs = require('fs');
        try { fs.unlinkSync(req.file.path); } catch (e) {}

        res.json({
            success: true,
            data: {
                count: importedCount,
                total: cards.length,
                errors: importErrors
            }
        });
    } catch (error) {
        console.error('Batch import error:', error);
        if (req.file) {
            const fs = require('fs');
            try { fs.unlinkSync(req.file.path); } catch (e) {}
        }
        res.status(500).json({
            success: false,
            code: 500,
            message: error.message || '批量导入失败'
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

router.post('/batch-move', auth, async (req, res) => {
    try {
        const { cardIds, chapterId } = req.body;

        if (!cardIds || !Array.isArray(cardIds) || cardIds.length === 0) {
            return res.status(400).json({
                success: false,
                code: 400,
                message: '请选择要移动的卡片'
            });
        }

        const result = await CardModel.batchUpdateChapter(cardIds, chapterId || null, req.user.id);

        res.json({
            success: true,
            data: { count: result.count }
        });
    } catch (error) {
        console.error('Batch move cards error:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '批量移动卡片失败'
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

router.get('/review/list', auth, async (req, res) => {
    try {
        const cards = await MasteryModel.getReviewCards(req.user.id);

        res.json({
            success: true,
            data: cards
        });
    } catch (error) {
        console.error('Get review cards error:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '获取复习卡片失败'
        });
    }
});

router.get('/review/count', auth, async (req, res) => {
    try {
        const count = await MasteryModel.getReviewCount(req.user.id);

        res.json({
            success: true,
            data: { count }
        });
    } catch (error) {
        console.error('Get review count error:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '获取复习数量失败'
        });
    }
});

module.exports = router;
