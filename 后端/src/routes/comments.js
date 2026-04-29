const express = require('express');
const CommentModel = require('../models/Comment');
const { auth } = require('../middlewares/auth');

const router = express.Router();

router.delete('/:id', auth, async (req, res) => {
    try {
        const deleted = await CommentModel.delete(req.params.id, req.user.id);

        if (!deleted) {
            return res.status(404).json({
                success: false,
                code: 404,
                message: '评论不存在或无权删除'
            });
        }

        res.json({
            success: true,
            message: '删除成功'
        });
    } catch (error) {
        console.error('Delete comment error:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '删除评论失败'
        });
    }
});

router.post('/:id/like', auth, async (req, res) => {
    try {
        const result = await CommentModel.toggleLike(req.params.id, req.user.id);

        if (!result.success) {
            return res.status(400).json({
                success: false,
                code: 400,
                message: result.message
            });
        }

        res.json({
            success: true,
            data: {
                liked: result.liked
            },
            message: result.message
        });
    } catch (error) {
        console.error('Toggle like error:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '操作失败'
        });
    }
});

router.post('/:id/unlike', auth, async (req, res) => {
    try {
        const result = await CommentModel.unlike(req.params.id, req.user.id);

        if (!result.success) {
            return res.status(400).json({
                success: false,
                code: 400,
                message: result.message
            });
        }

        res.json({
            success: true,
            message: result.message
        });
    } catch (error) {
        console.error('Unlike error:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '取消点赞失败'
        });
    }
});

module.exports = router;
