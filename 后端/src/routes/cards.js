const express = require('express');
const multer = require('multer');
const xlsx = require('xlsx');
const XLSXStyle = require('xlsx-js-style');
const path = require('path');
const db = require('../config/database');
const CardModel = require('../models/Card');
const ChapterModel = require('../models/Chapter');
const StudyModel = require('../models/Study');
const CommentModel = require('../models/Comment');
const FavoriteModel = require('../models/Favorite');
const LikeModel = require('../models/Like');
const MasteryModel = require('../models/Mastery');
const CardLinkModel = require('../models/CardLink');
const bm25Engine = require('../services/bm25');
const sentenceEmbedding = require('../services/sentenceEmbedding');
const resultFusion = require('../services/resultFusion');
const sensitiveWordFilter = require('../utils/sensitiveWordFilter');
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
        const { limit, page, pageSize } = req.query;
        const cards = await CardModel.getHotCards(
            parseInt(limit) || 10, 
            req.user?.id,
            parseInt(page) || null,
            parseInt(pageSize) || null
        );

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

router.get('/my', auth, async (req, res) => {
    try {
        const { page, pageSize } = req.query;
        const result = await CardModel.getMyCards(req.user.id, {
            page: parseInt(page) || 1,
            pageSize: parseInt(pageSize) || 20
        });

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Get my cards error:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '获取我的卡片失败'
        });
    }
});

router.get('/template', (req, res) => {
    try {
        const workbook = XLSXStyle.utils.book_new();
        
        const templateData = [
            ['问题（必填）', '答案（必填）', '关键词（选填，英文逗号分隔）', '一级标题（必填）', '二级标题（选填）'],
            ['什么是人工智能？', '人工智能是计算机科学的一个分支，致力于创建能够执行通常需要人类智能的任务的系统。', '人工智能,AI,机器学习', '人工智能基础', ''],
            ['机器学习的基本类型有哪些？', '机器学习主要分为监督学习、无监督学习和强化学习三种类型。', '机器学习,监督学习,无监督学习', '人工智能基础', '机器学习'],
            ['什么是深度学习？', '深度学习是机器学习的一个子集，使用多层神经网络来学习数据的表示。', '深度学习,神经网络', '人工智能基础', '深度学习']
        ];
        
        const worksheet = XLSXStyle.utils.aoa_to_sheet(templateData);
        
        const headerCells = ['A1', 'B1', 'C1', 'D1', 'E1'];
        headerCells.forEach(cell => {
            if (worksheet[cell]) {
                worksheet[cell].s = {
                    font: {
                        sz: 11,
                    },
                    fill: {
                        fgColor: { rgb: 'E8F4FD' }
                    },
                    alignment: {
                        horizontal: 'center',
                        vertical: 'center'
                    }
                };
            }
        });
        
        worksheet['!cols'] = [
            { wch: 20 },
            { wch: 50 },
            { wch: 28 },
            { wch: 18 },
            { wch: 15 }
        ];
        
        XLSXStyle.utils.book_append_sheet(workbook, worksheet, '批量导入模板');
        
        const buffer = XLSXStyle.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=card_import_template.xlsx');
        res.send(buffer);
    } catch (error) {
        console.error('生成模板失败:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '生成模板失败'
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
            const keywords = row[2] ? String(row[2]).trim() : '';
            const chapterLevel1 = row[3] ? String(row[3]).trim() : '';
            const chapterLevel2 = row[4] ? String(row[4]).trim() : '';

            if (!question && !answer && !chapterLevel1) continue;

            if (!question) {
                errors.push({
                    row: i + 2,
                    message: `第${i + 2}行：问题不能为空`
                });
                continue;
            }

            if (!answer) {
                errors.push({
                    row: i + 2,
                    message: `第${i + 2}行：答案不能为空`
                });
                continue;
            }

            if (!chapterLevel1) {
                errors.push({
                    row: i + 2,
                    message: `第${i + 2}行：一级标题不能为空`
                });
                continue;
            }

            let keywordsArray = [];
            if (keywords) {
                keywordsArray = keywords.split(',').map(k => k.trim()).filter(k => k.length > 0);
            }

            cards.push({ 
                question, 
                answer, 
                keywords: keywordsArray,
                chapterLevel1, 
                chapterLevel2 
            });
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
                        keywords: c.keywords,
                        chapterLevel1: c.chapterLevel1,
                        chapterLevel2: c.chapterLevel2
                    })),
                    total: cards.length,
                    errors: errors
                }
            });
        }

        const chapterMap = {};
        const existingChapters = await ChapterModel.getList(library_id);
        existingChapters.forEach(ch => {
            chapterMap[ch.name] = { id: ch.id, level: ch.level, parentId: ch.parent_id };
        });

        let importedCount = 0;
        const importErrors = [];

        for (let i = 0; i < cards.length; i++) {
            const card = cards[i];
            try {
                let chapterId = null;
                
                if (card.chapterLevel1) {
                    let level1ChapterId = null;
                    
                    if (chapterMap[card.chapterLevel1]) {
                        level1ChapterId = chapterMap[card.chapterLevel1].id;
                    } else {
                        const newChapter = await ChapterModel.create({
                            library_id,
                            name: card.chapterLevel1,
                            sort_order: Object.keys(chapterMap).filter(k => !chapterMap[k].parentId).length,
                            level: 1,
                            parent_id: null
                        });
                        chapterMap[card.chapterLevel1] = { id: newChapter.id, level: 1, parentId: null };
                        level1ChapterId = newChapter.id;
                    }
                    
                    if (card.chapterLevel2) {
                        const level2Key = `${card.chapterLevel1}/${card.chapterLevel2}`;
                        
                        if (chapterMap[level2Key]) {
                            chapterId = chapterMap[level2Key].id;
                        } else {
                            const newChapter = await ChapterModel.create({
                                library_id,
                                name: card.chapterLevel2,
                                sort_order: Object.keys(chapterMap).filter(k => chapterMap[k].parentId === level1ChapterId).length,
                                level: 2,
                                parent_id: level1ChapterId
                            });
                            chapterMap[level2Key] = { id: newChapter.id, level: 2, parentId: level1ChapterId };
                            chapterId = newChapter.id;
                        }
                    } else {
                        chapterId = level1ChapterId;
                    }
                }

                await CardModel.create({
                    library_id: parseInt(library_id),
                    chapter_id: chapterId,
                    question: card.question,
                    answer: card.answer,
                    keywords: card.keywords,
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

router.get('/search/config', auth, (req, res) => {
    try {
        const config = {
            bm25: bm25Engine.getParams(),
            embedding: sentenceEmbedding.getStatus(),
            fusion: resultFusion.getConfig()
        };

        res.json({
            success: true,
            data: config
        });
    } catch (error) {
        console.error('Get search config error:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '获取搜索配置失败'
        });
    }
});

router.put('/search/config', auth, async (req, res) => {
    try {
        const { bm25, fusion } = req.body;

        if (bm25) {
            const { k1, b, k3 } = bm25;
            if (k1 !== undefined || b !== undefined || k3 !== undefined) {
                await bm25Engine.updateParams(k1, b, k3);
            }
        }

        if (fusion) {
            const { bm25Weight, embeddingWeight, tagWeight, strategy } = fusion;
            if (bm25Weight !== undefined || embeddingWeight !== undefined || tagWeight !== undefined) {
                resultFusion.updateWeights(bm25Weight, embeddingWeight, tagWeight);
            }
            if (strategy) {
                resultFusion.setStrategy(strategy);
            }
        }

        const config = {
            bm25: bm25Engine.getParams(),
            embedding: sentenceEmbedding.getStatus(),
            fusion: resultFusion.getConfig()
        };

        res.json({
            success: true,
            data: config,
            message: '搜索配置更新成功'
        });
    } catch (error) {
        console.error('Update search config error:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '更新搜索配置失败'
        });
    }
});

router.post('/search/rebuild', auth, async (req, res) => {
    try {
        await bm25Engine.invalidateCache();
        await sentenceEmbedding.invalidateCache();

        res.json({
            success: true,
            message: '搜索索引重建已触发'
        });
    } catch (error) {
        console.error('Rebuild search index error:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '重建搜索索引失败'
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
        const { cardIds, chapterId, libraryId } = req.body;

        if (!cardIds || !Array.isArray(cardIds) || cardIds.length === 0) {
            return res.status(400).json({
                success: false,
                code: 400,
                message: '请选择要移动的卡片'
            });
        }

        if (libraryId) {
            const [libCheck] = await db.execute(
                'SELECT id FROM libraries WHERE id = ? AND created_by = ?',
                [libraryId, req.user.id]
            );

            if (libCheck.length === 0) {
                return res.status(403).json({
                    success: false,
                    code: 403,
                    message: '无权操作该知识库'
                });
            }

            if (chapterId) {
                const [chapterCheck] = await db.execute(
                    'SELECT id FROM chapters WHERE id = ? AND library_id = ?',
                    [chapterId, libraryId]
                );
                if (chapterCheck.length === 0) {
                    return res.status(400).json({
                        success: false,
                        code: 400,
                        message: '章节不存在或不属于该知识库'
                    });
                }
            }
        }

        const result = await CardModel.batchUpdateChapter(cardIds, chapterId || null, req.user.id, libraryId || null);

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

router.post('/batch-copy', auth, async (req, res) => {
    try {
        const { cardIds, libraryId, chapterId } = req.body;

        if (!cardIds || !Array.isArray(cardIds) || cardIds.length === 0) {
            return res.status(400).json({
                success: false,
                code: 400,
                message: '请选择要复制的卡片'
            });
        }

        if (!libraryId) {
            return res.status(400).json({
                success: false,
                code: 400,
                message: '请选择目标知识库'
            });
        }

        const [libCheck] = await db.execute(
            'SELECT id FROM libraries WHERE id = ? AND created_by = ?',
            [libraryId, req.user.id]
        );

        if (libCheck.length === 0) {
            return res.status(403).json({
                success: false,
                code: 403,
                message: '无权操作该知识库'
            });
        }

        if (chapterId) {
            const [chapterCheck] = await db.execute(
                'SELECT id FROM chapters WHERE id = ? AND library_id = ?',
                [chapterId, libraryId]
            );
            if (chapterCheck.length === 0) {
                return res.status(400).json({
                    success: false,
                    code: 400,
                    message: '章节不存在或不属于该知识库'
                });
            }
        }

        const [cards] = await db.execute(
            'SELECT * FROM cards WHERE id IN (' + cardIds.map(() => '?').join(',') + ')',
            cardIds
        );

        let copiedCount = 0;
        for (const card of cards) {
            let cardTags = card.tags;
            if (typeof cardTags === 'string') {
                try {
                    cardTags = JSON.parse(cardTags);
                } catch (e) {
                    cardTags = [];
                }
            }
            if (!Array.isArray(cardTags)) {
                cardTags = [];
            }
            
            await CardModel.create({
                library_id: libraryId,
                chapter_id: chapterId || null,
                question: card.question,
                answer: card.answer,
                tags: cardTags,
                created_by: req.user.id,
                is_public: 0
            });
            copiedCount++;
        }

        res.json({
            success: true,
            data: { count: copiedCount }
        });
    } catch (error) {
        console.error('Batch copy cards error:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '批量复制卡片失败'
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

        const { feedback, duration, isFormalStudy } = req.body;
        
        await StudyModel.recordStudy(
            req.user.id,
            req.params.id,
            card.library_id,
            feedback || 'normal',
            duration || 0,
            isFormalStudy || false
        );
        
        if (isFormalStudy) {
            await CardModel.incrementStudyCount(req.params.id);
        }

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

router.get('/:cardId/comments', optionalAuth, async (req, res) => {
    try {
        const { page, pageSize } = req.query;
        const userId = req.user?.id || null;
        
        const result = await CommentModel.getList(req.params.cardId, {
            page: parseInt(page) || 1,
            pageSize: parseInt(pageSize) || 10
        }, userId);

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

        const sensitiveCheck = await sensitiveWordFilter.contains(content);
        if (sensitiveCheck.hasSensitive) {
            return res.status(400).json({
                success: false,
                code: 400,
                message: '评论包含敏感词，请修改后重新发布',
                data: {
                    word: sensitiveCheck.word
                }
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

        const { mastered, feedback = 'normal' } = req.body;
        const result = await MasteryModel.setMastery(
            req.user.id,
            req.params.id,
            card.library_id,
            mastered,
            feedback
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

        const { feedback = 'normal' } = req.body;
        const result = await MasteryModel.toggle(
            req.user.id,
            req.params.id,
            card.library_id,
            feedback
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

router.get('/difficulty/stats', auth, async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT 
                COUNT(CASE WHEN difficulty_rating >= 4.5 THEN 1 END) as hell_count,
                COUNT(CASE WHEN difficulty_rating >= 3.5 AND difficulty_rating < 4.5 THEN 1 END) as hard_count,
                COUNT(CASE WHEN difficulty_rating >= 2.5 AND difficulty_rating < 3.5 THEN 1 END) as medium_count,
                COUNT(CASE WHEN difficulty_rating >= 1 AND difficulty_rating < 2.5 THEN 1 END) as easy_count,
                COUNT(CASE WHEN difficulty_count > 0 THEN 1 END) as total_rated,
                SUM(CASE WHEN difficulty_rating >= 4.5 THEN difficulty_count ELSE 0 END) as hell_raters,
                SUM(CASE WHEN difficulty_rating >= 3.5 AND difficulty_rating < 4.5 THEN difficulty_count ELSE 0 END) as hard_raters,
                SUM(CASE WHEN difficulty_rating >= 2.5 AND difficulty_rating < 3.5 THEN difficulty_count ELSE 0 END) as medium_raters,
                SUM(CASE WHEN difficulty_rating >= 1 AND difficulty_rating < 2.5 THEN difficulty_count ELSE 0 END) as easy_raters
            FROM cards
        `);
        
        res.json({
            success: true,
            data: {
                hell: rows[0].hell_count || 0,
                hard: rows[0].hard_count || 0,
                medium: rows[0].medium_count || 0,
                easy: rows[0].easy_count || 0,
                total: rows[0].total_rated || 0,
                hellRaters: rows[0].hell_raters || 0,
                hardRaters: rows[0].hard_raters || 0,
                mediumRaters: rows[0].medium_raters || 0,
                easyRaters: rows[0].easy_raters || 0
            }
        });
    } catch (error) {
        console.error('Get difficulty stats error:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '获取难度统计失败'
        });
    }
});

router.get('/difficulty/cards', auth, async (req, res) => {
    try {
        const { level } = req.query;
        
        let minDifficulty, maxDifficulty;
        
        switch (level) {
            case 'hell':
                minDifficulty = 4.5;
                maxDifficulty = 5.0;
                break;
            case 'hard':
                minDifficulty = 3.5;
                maxDifficulty = 4.49;
                break;
            case 'medium':
                minDifficulty = 2.5;
                maxDifficulty = 3.49;
                break;
            case 'easy':
                minDifficulty = 1.0;
                maxDifficulty = 2.49;
                break;
            default:
                return res.status(400).json({
                    success: false,
                    code: 400,
                    message: '无效的难度等级'
                });
        }
        
        const [rows] = await db.execute(`
            SELECT c.id, c.question, c.answer, c.keywords, c.tags, c.library_id, 
                   c.difficulty_rating, c.difficulty_count, l.name as library_name
            FROM cards c
            LEFT JOIN libraries l ON c.library_id = l.id
            WHERE c.difficulty_count > 0
            AND c.difficulty_rating >= ? 
            AND c.difficulty_rating <= ?
            ORDER BY c.difficulty_rating DESC
        `, [minDifficulty, maxDifficulty]);
        
        const cards = rows.map(row => ({
            id: row.id,
            question: row.question,
            answer: row.answer,
            keywords: row.keywords || '',
            tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : (row.tags || []),
            libraryId: row.library_id,
            libraryName: row.library_name,
            difficultyRating: parseFloat(row.difficulty_rating) || 0,
            difficultyCount: row.difficulty_count
        }));
        
        res.json({
            success: true,
            data: cards
        });
    } catch (error) {
        console.error('Get difficulty cards error:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '获取难度卡片失败'
        });
    }
});

router.post('/:id/difficulty', auth, async (req, res) => {
    try {
        const { rating } = req.body;
        
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                code: 400,
                message: '难度评分必须在1-5之间'
            });
        }

        const card = await CardModel.findById(req.params.id);
        
        if (!card) {
            return res.status(404).json({
                success: false,
                code: 404,
                message: '卡片不存在'
            });
        }

        const result = await CardModel.rateDifficulty(req.params.id, rating);

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Rate difficulty error:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '评分失败'
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

router.get('/:id/related', optionalAuth, async (req, res) => {
    try {
        const { limit } = req.query;
        console.log('Get related cards for card:', req.params.id, 'user:', req.user?.id);
        const cards = await CardModel.getRelatedCards(
            parseInt(req.params.id),
            req.user?.id,
            parseInt(limit) || 5
        );
        console.log('Related cards found:', cards.length);

        res.json({
            success: true,
            data: cards
        });
    } catch (error) {
        console.error('Get related cards error:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '获取相关卡片失败'
        });
    }
});

router.post('/:id/link', auth, async (req, res) => {
    try {
        const { linkedCardIds } = req.body;
        const cardId = parseInt(req.params.id);
        
        console.log('Link cards request:', { cardId, linkedCardIds, userId: req.user.id });
        
        if (!linkedCardIds || !Array.isArray(linkedCardIds) || linkedCardIds.length === 0) {
            return res.status(400).json({
                success: false,
                code: 400,
                message: '请选择要关联的卡片'
            });
        }

        const card = await CardModel.findById(cardId);
        if (!card) {
            return res.status(404).json({
                success: false,
                code: 404,
                message: '卡片不存在'
            });
        }

        await CardLinkModel.createTable();
        const count = await CardLinkModel.addLinks(cardId, linkedCardIds, req.user.id);
        
        console.log('Link cards result:', count);

        res.json({
            success: true,
            data: { count },
            message: `成功关联 ${count} 张卡片`
        });
    } catch (error) {
        console.error('Link cards error:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '关联卡片失败'
        });
    }
});

router.delete('/:id/link/:linkedId', auth, async (req, res) => {
    try {
        const cardId = parseInt(req.params.id);
        const linkedCardId = parseInt(req.params.linkedId);

        const success = await CardLinkModel.removeLink(cardId, linkedCardId, req.user.id);

        if (success) {
            res.json({
                success: true,
                message: '取消关联成功'
            });
        } else {
            res.status(404).json({
                success: false,
                code: 404,
                message: '关联关系不存在'
            });
        }
    } catch (error) {
        console.error('Unlink card error:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '取消关联失败'
        });
    }
});

router.get('/:id/linked', auth, async (req, res) => {
    try {
        const cardId = parseInt(req.params.id);
        const cards = await CardLinkModel.getLinkedCards(cardId, req.user.id);

        res.json({
            success: true,
            data: cards
        });
    } catch (error) {
        console.error('Get linked cards error:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '获取已关联卡片失败'
        });
    }
});

module.exports = router;
