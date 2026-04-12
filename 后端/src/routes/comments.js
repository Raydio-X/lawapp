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

router.post('/:id/like', async (req, res) => {
    try {
        await CommentModel.like(req.params.id);

        res.json({
            success: true,
            message: '点赞成功'
        });
    } catch (error) {
        console.error('Like comment error:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '点赞失败'
        });
    }
});

module.exports = router;
