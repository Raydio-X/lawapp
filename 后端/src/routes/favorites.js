const express = require('express');
const FavoriteModel = require('../models/Favorite');
const db = require('../config/database');
const { auth } = require('../middlewares/auth');

const router = express.Router();

router.get('/libraries', auth, async (req, res) => {
    try {
        const { page = 1, pageSize = 100 } = req.query;
        const offset = (page - 1) * pageSize;

        const [rows] = await db.execute(
            `SELECT l.id, l.name, l.description, l.subject, l.created_at,
                    (SELECT COUNT(*) FROM cards c WHERE c.library_id = l.id) as total_cards,
                    (SELECT COUNT(*) FROM card_mastery cm 
                     JOIN cards c ON c.id = cm.card_id 
                     WHERE c.library_id = l.id AND cm.user_id = ? AND cm.mastered = 1) as learned_cards,
                    (SELECT COUNT(*) FROM favorites f WHERE f.target_type = 'library' AND f.target_id = l.id) as favorite_count,
                    f.created_at as favorited_at
             FROM favorites f
             JOIN libraries l ON l.id = f.target_id
             WHERE f.user_id = ? AND f.target_type = 'library' AND l.created_by != ?
             ORDER BY f.created_at DESC
             LIMIT ${parseInt(pageSize)} OFFSET ${offset}`,
            [req.user.id, req.user.id, req.user.id]
        );

        const [countRows] = await db.execute(
            `SELECT COUNT(*) as total FROM favorites f
             JOIN libraries l ON l.id = f.target_id
             WHERE f.user_id = ? AND f.target_type = ? AND l.created_by != ?`,
            [req.user.id, 'library', req.user.id]
        );

        const libraries = rows.map(row => ({
            id: row.id,
            name: row.name,
            description: row.description,
            subject: row.subject,
            createdAt: row.created_at,
            totalCards: row.total_cards,
            learnedCards: row.learned_cards,
            favoriteCount: row.favorite_count,
            favoritedAt: row.favorited_at,
            isFavorited: true
        }));

        res.json({
            success: true,
            data: {
                libraries,
                pagination: {
                    page: parseInt(page),
                    pageSize: parseInt(pageSize),
                    total: countRows[0].total
                }
            }
        });
    } catch (error) {
        console.error('Get favorite libraries error:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '获取收藏知识库失败'
        });
    }
});

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
