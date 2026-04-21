const express = require('express');
const MessageModel = require('../models/message');
const { auth, adminAuth } = require('../middlewares/auth');

const router = express.Router();

router.get('/', auth, async (req, res) => {
    try {
        const { page, pageSize, type } = req.query;
        const result = await MessageModel.getList(req.user.id, {
            page: page || 1,
            pageSize: pageSize || 20,
            type
        });

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({ success: false, code: 500, message: '获取消息列表失败' });
    }
});

router.get('/unread-count', auth, async (req, res) => {
    try {
        const count = await MessageModel.getUnreadCount(req.user.id);

        res.json({
            success: true,
            data: { count }
        });
    } catch (error) {
        console.error('Get unread count error:', error);
        res.status(500).json({ success: false, code: 500, message: '获取未读数失败' });
    }
});

router.put('/:id/read', auth, async (req, res) => {
    try {
        const read = await MessageModel.markAsRead(req.params.id, req.user.id);

        if (!read) {
            return res.status(404).json({ success: false, code: 404, message: '消息不存在' });
        }

        res.json({ success: true, message: '已标记为已读' });
    } catch (error) {
        console.error('Mark as read error:', error);
        res.status(500).json({ success: false, code: 500, message: '标记已读失败' });
    }
});

router.put('/read-all', auth, async (req, res) => {
    try {
        const count = await MessageModel.markAllAsRead(req.user.id);

        res.json({ success: true, data: { count }, message: '已全部标记为已读' });
    } catch (error) {
        console.error('Mark all as read error:', error);
        res.status(500).json({ success: false, code: 500, message: '标记已读失败' });
    }
});

router.delete('/:id', auth, async (req, res) => {
    try {
        const deleted = await MessageModel.delete(req.params.id, req.user.id);

        if (!deleted) {
            return res.status(404).json({ success: false, code: 404, message: '消息不存在' });
        }

        res.json({ success: true, message: '删除成功' });
    } catch (error) {
        console.error('Delete message error:', error);
        res.status(500).json({ success: false, code: 500, message: '删除消息失败' });
    }
});

router.post('/broadcast', adminAuth, async (req, res) => {
    try {
        const { title, content } = req.body;

        if (!title || !content) {
            return res.status(400).json({ success: false, code: 400, message: '标题和内容不能为空' });
        }

        const result = await MessageModel.broadcast({
            title,
            content,
            type: 'announcement',
            sender_id: req.user.id
        });

        res.status(201).json({
            success: true,
            data: { count: result.count },
            message: `已向 ${result.count} 位用户发送通知`
        });
    } catch (error) {
        console.error('Broadcast message error:', error);
        res.status(500).json({ success: false, code: 500, message: '发送通知失败' });
    }
});

module.exports = router;
