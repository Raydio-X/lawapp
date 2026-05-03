const express = require('express');
const FeedbackModel = require('../models/Feedback');
const { auth, adminAuth } = require('../middlewares/auth');

const router = express.Router();

router.post('/', auth, async (req, res) => {
    try {
        const { content, contact } = req.body;

        if (!content || content.trim().length === 0) {
            return res.status(400).json({
                success: false,
                code: 400,
                message: '请输入反馈内容'
            });
        }

        if (content.length > 1000) {
            return res.status(400).json({
                success: false,
                code: 400,
                message: '反馈内容不能超过1000字'
            });
        }

        const feedbackId = await FeedbackModel.create(req.user.id, content.trim(), contact || null);

        res.json({
            success: true,
            data: { id: feedbackId },
            message: '提交成功，感谢您的反馈'
        });
    } catch (error) {
        console.error('Submit feedback error:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '提交失败，请稍后重试'
        });
    }
});

router.get('/my', auth, async (req, res) => {
    try {
        const { page, pageSize } = req.query;
        const result = await FeedbackModel.getUserFeedbacks(
            req.user.id,
            parseInt(page) || 1,
            parseInt(pageSize) || 20
        );

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Get user feedbacks error:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '获取反馈列表失败'
        });
    }
});

router.get('/list', auth, adminAuth, async (req, res) => {
    try {
        const { page, pageSize, status } = req.query;
        const result = await FeedbackModel.getList({
            page: parseInt(page) || 1,
            pageSize: parseInt(pageSize) || 20,
            status: status
        });

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Get feedback list error:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '获取反馈列表失败'
        });
    }
});

router.get('/:id', auth, adminAuth, async (req, res) => {
    try {
        const feedback = await FeedbackModel.getById(parseInt(req.params.id));

        if (!feedback) {
            return res.status(404).json({
                success: false,
                code: 404,
                message: '反馈不存在'
            });
        }

        res.json({
            success: true,
            data: feedback
        });
    } catch (error) {
        console.error('Get feedback error:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '获取反馈详情失败'
        });
    }
});

router.put('/:id/status', auth, adminAuth, async (req, res) => {
    try {
        const { status, reply } = req.body;
        const id = parseInt(req.params.id);

        if (status === undefined) {
            return res.status(400).json({
                success: false,
                code: 400,
                message: '请提供状态'
            });
        }

        const success = await FeedbackModel.updateStatus(id, status, reply || null);

        if (!success) {
            return res.status(404).json({
                success: false,
                code: 404,
                message: '反馈不存在'
            });
        }

        res.json({
            success: true,
            message: '更新成功'
        });
    } catch (error) {
        console.error('Update feedback status error:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '更新失败'
        });
    }
});

module.exports = router;
