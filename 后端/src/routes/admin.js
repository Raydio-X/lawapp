const express = require('express');
const LibraryModel = require('../models/Library');
const CardModel = require('../models/Card');
const CommentModel = require('../models/Comment');
const ChapterModel = require('../models/Chapter');
const UserModel = require('../models/User');
const { adminAuth } = require('../middlewares/auth');

const router = express.Router();

router.get('/libraries', adminAuth, async (req, res) => {
    try {
        const { page, pageSize, keyword, is_public, own_only } = req.query;
        const offset = ((parseInt(page) || 1) - 1) * (parseInt(pageSize) || 20);

        let sql = `SELECT l.*, u.nickname as creator_name,
                   (SELECT COUNT(*) FROM cards c WHERE c.library_id = l.id) as card_count
                   FROM libraries l 
                   LEFT JOIN users u ON l.created_by = u.id 
                   WHERE 1=1`;
        const values = [];

        if (own_only === '1') {
            sql += ' AND l.created_by = ?';
            values.push(req.user.id);
        }
        if (keyword) {
            sql += ' AND (l.name LIKE ? OR l.description LIKE ?)';
            values.push(`%${keyword}%`, `%${keyword}%`);
        }
        if (is_public !== undefined && is_public !== '') {
            sql += ' AND l.is_public = ?';
            values.push(parseInt(is_public));
        }

        let countSql = 'SELECT COUNT(*) as total FROM libraries WHERE 1=1';
        const countValues = [];
        if (own_only === '1') {
            countSql += ' AND created_by = ?';
            countValues.push(req.user.id);
        }
        if (keyword) {
            countSql += ' AND (name LIKE ? OR description LIKE ?)';
            countValues.push(`%${keyword}%`, `%${keyword}%`);
        }
        if (is_public !== undefined && is_public !== '') {
            countSql += ' AND is_public = ?';
            countValues.push(parseInt(is_public));
        }

        const [countRows] = await require('../config/database').execute(countSql, countValues);

        sql += ` ORDER BY l.created_at DESC LIMIT ${parseInt(pageSize) || 20} OFFSET ${offset}`;

        const [rows] = await require('../config/database').execute(sql, values);

        const libraries = rows.map(row => {
            let tags = [];
            try {
                if (row.description) {
                    tags = JSON.parse(row.description);
                }
            } catch (e) {
                tags = [];
            }
            return {
                ...row,
                tags: Array.isArray(tags) ? tags : []
            };
        });

        res.json({
            success: true,
            data: {
                list: libraries,
                pagination: {
                    page: parseInt(page) || 1,
                    pageSize: parseInt(pageSize) || 20,
                    total: countRows[0].total,
                    totalPages: Math.ceil(countRows[0].total / (parseInt(pageSize) || 20))
                }
            }
        });
    } catch (error) {
        console.error('Admin get libraries error:', error);
        res.status(500).json({ success: false, code: 500, message: '获取知识库列表失败' });
    }
});

router.put('/libraries/:id', adminAuth, async (req, res) => {
    try {
        const library = await LibraryModel.findById(req.params.id);
        if (!library) {
            return res.status(404).json({ success: false, code: 404, message: '知识库不存在' });
        }
        if (library.created_by !== req.user.id) {
            return res.status(403).json({ success: false, code: 403, message: '无权编辑此知识库' });
        }

        const { name, subject, description } = req.body;
        const updated = await LibraryModel.update(req.params.id, {
            name,
            subject,
            description,
            is_public: 1
        });

        res.json({ success: true, data: updated });
    } catch (error) {
        console.error('Admin update library error:', error);
        res.status(500).json({ success: false, code: 500, message: '更新知识库失败' });
    }
});

router.delete('/libraries/:id', adminAuth, async (req, res) => {
    try {
        const library = await LibraryModel.findById(req.params.id);
        if (!library) {
            return res.status(404).json({ success: false, code: 404, message: '知识库不存在' });
        }
        if (library.created_by !== req.user.id) {
            return res.status(403).json({ success: false, code: 403, message: '无权删除此知识库' });
        }

        await LibraryModel.delete(req.params.id);
        res.json({ success: true, message: '删除成功' });
    } catch (error) {
        console.error('Admin delete library error:', error);
        res.status(500).json({ success: false, code: 500, message: '删除知识库失败' });
    }
});

router.post('/libraries', adminAuth, async (req, res) => {
    try {
        const { name, subject, tags, is_public } = req.body;

        if (!name || !subject) {
            return res.status(400).json({ success: false, code: 400, message: '知识库名称和学科不能为空' });
        }

        const tagsJson = Array.isArray(tags) ? JSON.stringify(tags) : '[]';

        const library = await LibraryModel.create({
            name,
            subject,
            description: tagsJson,
            cover_image: '',
            created_by: req.user.id,
            is_public: is_public !== undefined ? is_public : 1
        });

        res.status(201).json({ success: true, data: library });
    } catch (error) {
        console.error('Admin create library error:', error);
        res.status(500).json({ success: false, code: 500, message: '创建知识库失败' });
    }
});

router.get('/cards', adminAuth, async (req, res) => {
    try {
        const { page, pageSize, keyword, is_public, is_hot } = req.query;
        const offset = ((parseInt(page) || 1) - 1) * (parseInt(pageSize) || 20);

        let sql = `SELECT c.*, l.name as library_name, ch.name as chapter_name
                   FROM cards c 
                   LEFT JOIN libraries l ON c.library_id = l.id 
                   LEFT JOIN chapters ch ON c.chapter_id = ch.id 
                   WHERE 1=1`;
        const values = [];

        if (keyword) {
            sql += ' AND (c.question LIKE ? OR c.answer LIKE ?)';
            values.push(`%${keyword}%`, `%${keyword}%`);
        }
        if (is_public !== undefined && is_public !== '') {
            sql += ' AND c.is_public = ?';
            values.push(parseInt(is_public));
        }
        if (is_hot === '1') {
            sql += ' ORDER BY c.like_count DESC, c.study_count DESC';
        } else {
            sql += ' ORDER BY c.created_at DESC';
        }

        let countSql = 'SELECT COUNT(*) as total FROM cards WHERE 1=1';
        const countValues = [];
        if (keyword) {
            countSql += ' AND (question LIKE ? OR answer LIKE ?)';
            countValues.push(`%${keyword}%`, `%${keyword}%`);
        }
        if (is_public !== undefined && is_public !== '') {
            countSql += ' AND is_public = ?';
            countValues.push(parseInt(is_public));
        }

        const [countRows] = await require('../config/database').execute(countSql, countValues);

        sql += ` LIMIT ${parseInt(pageSize) || 20} OFFSET ${offset}`;

        const [rows] = await require('../config/database').execute(sql, values);

        res.json({
            success: true,
            data: {
                list: rows.map(row => ({
                    ...row,
                    tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : (row.tags || [])
                })),
                pagination: {
                    page: parseInt(page) || 1,
                    pageSize: parseInt(pageSize) || 20,
                    total: countRows[0].total,
                    totalPages: Math.ceil(countRows[0].total / (parseInt(pageSize) || 20))
                }
            }
        });
    } catch (error) {
        console.error('Admin get cards error:', error);
        res.status(500).json({ success: false, code: 500, message: '获取卡片列表失败' });
    }
});

router.put('/cards/:id', adminAuth, async (req, res) => {
    try {
        const card = await CardModel.findById(req.params.id);
        if (!card) {
            return res.status(404).json({ success: false, code: 404, message: '卡片不存在' });
        }
        if (card.created_by !== req.user.id) {
            return res.status(403).json({ success: false, code: 403, message: '无权编辑此卡片' });
        }

        const { question, answer, tags } = req.body;
        const updated = await CardModel.update(req.params.id, {
            question,
            answer,
            tags,
            is_public: 1
        });

        res.json({ success: true, data: updated });
    } catch (error) {
        console.error('Admin update card error:', error);
        res.status(500).json({ success: false, code: 500, message: '更新卡片失败' });
    }
});

router.delete('/cards/:id', adminAuth, async (req, res) => {
    try {
        const card = await CardModel.findById(req.params.id);
        if (!card) {
            return res.status(404).json({ success: false, code: 404, message: '卡片不存在' });
        }
        if (card.created_by !== req.user.id) {
            return res.status(403).json({ success: false, code: 403, message: '无权删除此卡片' });
        }

        await CardModel.delete(req.params.id);
        res.json({ success: true, message: '删除成功' });
    } catch (error) {
        console.error('Admin delete card error:', error);
        res.status(500).json({ success: false, code: 500, message: '删除卡片失败' });
    }
});

router.post('/cards', adminAuth, async (req, res) => {
    try {
        const { library_id, chapter_id, question, answer, tags, is_public } = req.body;

        if (!library_id || !question || !answer) {
            return res.status(400).json({ success: false, code: 400, message: '知识库ID、问题和答案不能为空' });
        }

        const card = await CardModel.create({
            library_id,
            chapter_id,
            question,
            answer,
            tags,
            created_by: req.user.id,
            is_public: is_public !== undefined ? is_public : 1
        });

        res.status(201).json({ success: true, data: card });
    } catch (error) {
        console.error('Admin create card error:', error);
        res.status(500).json({ success: false, code: 500, message: '创建卡片失败' });
    }
});

router.get('/comments', adminAuth, async (req, res) => {
    try {
        const { page, pageSize, keyword } = req.query;
        const offset = ((parseInt(page) || 1) - 1) * (parseInt(pageSize) || 20);

        let sql = `SELECT cm.*, u.nickname, u.avatar, c.question as card_question
                   FROM comments cm
                   LEFT JOIN users u ON cm.user_id = u.id
                   LEFT JOIN cards c ON cm.card_id = c.id
                   WHERE 1=1`;
        const values = [];

        if (keyword) {
            sql += ' AND cm.content LIKE ?';
            values.push(`%${keyword}%`);
        }

        let countSql = 'SELECT COUNT(*) as total FROM comments WHERE 1=1';
        const countValues = [];
        if (keyword) {
            countSql += ' AND content LIKE ?';
            countValues.push(`%${keyword}%`);
        }

        const [countRows] = await require('../config/database').execute(countSql, countValues);

        sql += ` ORDER BY cm.created_at DESC LIMIT ${parseInt(pageSize) || 20} OFFSET ${offset}`;

        const [rows] = await require('../config/database').execute(sql, values);

        res.json({
            success: true,
            data: {
                list: rows,
                pagination: {
                    page: parseInt(page) || 1,
                    pageSize: parseInt(pageSize) || 20,
                    total: countRows[0].total,
                    totalPages: Math.ceil(countRows[0].total / (parseInt(pageSize) || 20))
                }
            }
        });
    } catch (error) {
        console.error('Admin get comments error:', error);
        res.status(500).json({ success: false, code: 500, message: '获取评论列表失败' });
    }
});

router.delete('/comments/:id', adminAuth, async (req, res) => {
    try {
        const db = require('../config/database');
        const [result] = await db.execute('DELETE FROM comments WHERE id = ?', [req.params.id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, code: 404, message: '评论不存在' });
        }

        res.json({ success: true, message: '删除成功' });
    } catch (error) {
        console.error('Admin delete comment error:', error);
        res.status(500).json({ success: false, code: 500, message: '删除评论失败' });
    }
});

router.get('/stats', adminAuth, async (req, res) => {
    try {
        const db = require('../config/database');

        const [libCount] = await db.execute('SELECT COUNT(*) as count FROM libraries');
        const [cardCount] = await db.execute('SELECT COUNT(*) as count FROM cards');
        const [userCount] = await db.execute('SELECT COUNT(*) as count FROM users');
        const [commentCount] = await db.execute('SELECT COUNT(*) as count FROM comments');
        const [publicLibCount] = await db.execute('SELECT COUNT(*) as count FROM libraries WHERE is_public = 1');
        const [publicCardCount] = await db.execute('SELECT COUNT(*) as count FROM cards WHERE is_public = 1');

        res.json({
            success: true,
            data: {
                totalLibraries: libCount[0].count,
                totalCards: cardCount[0].count,
                totalUsers: userCount[0].count,
                totalComments: commentCount[0].count,
                publicLibraries: publicLibCount[0].count,
                publicCards: publicCardCount[0].count
            }
        });
    } catch (error) {
        console.error('Admin get stats error:', error);
        res.status(500).json({ success: false, code: 500, message: '获取统计数据失败' });
    }
});

module.exports = router;
