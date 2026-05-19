const express = require('express');
const CardChangeReviewModel = require('../models/CardChangeReview');
const { auth, adminAuth } = require('../middlewares/auth');

const router = express.Router();

router.get('/libraries', adminAuth, async (req, res) => {
    try {
        const { page, pageSize } = req.query;
        
        const result = await CardChangeReviewModel.getLibrariesWithPendingChanges({
            page: parseInt(page) || 1,
            pageSize: parseInt(pageSize) || 10
        });

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Get libraries with pending changes error:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '获取知识库列表失败'
        });
    }
});

router.get('/library/:libraryId', adminAuth, async (req, res) => {
    try {
        const { page, pageSize } = req.query;
        
        const result = await CardChangeReviewModel.getPendingByLibraryId(
            parseInt(req.params.libraryId),
            {
                page: parseInt(page) || 1,
                pageSize: parseInt(pageSize) || 20
            }
        );

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Get pending changes by library error:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '获取卡片变更列表失败'
        });
    }
});

router.get('/pending', adminAuth, async (req, res) => {
    try {
        const { page, pageSize, libraryId } = req.query;
        
        const result = await CardChangeReviewModel.getPendingList({
            page: parseInt(page) || 1,
            pageSize: parseInt(pageSize) || 10,
            libraryId: libraryId ? parseInt(libraryId) : null
        });

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Get pending reviews error:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '获取待审核列表失败'
        });
    }
});

router.get('/my', auth, async (req, res) => {
    try {
        const { page, pageSize } = req.query;
        
        const result = await CardChangeReviewModel.getMyReviews(req.user.id, {
            page: parseInt(page) || 1,
            pageSize: parseInt(pageSize) || 10
        });

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Get my reviews error:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '获取我的审核记录失败'
        });
    }
});

router.get('/:id', adminAuth, async (req, res) => {
    try {
        const review = await CardChangeReviewModel.findById(req.params.id);
        
        if (!review) {
            return res.status(404).json({
                success: false,
                code: 404,
                message: '审核记录不存在'
            });
        }

        res.json({
            success: true,
            data: review
        });
    } catch (error) {
        console.error('Get review error:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '获取审核详情失败'
        });
    }
});

router.post('/:id/approve', adminAuth, async (req, res) => {
    try {
        const review = await CardChangeReviewModel.approve(req.params.id, req.user.id);

        res.json({
            success: true,
            data: review,
            message: '审核通过'
        });
    } catch (error) {
        console.error('Approve review error:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: error.message || '审核通过失败'
        });
    }
});

router.post('/:id/reject', adminAuth, async (req, res) => {
    try {
        const { note } = req.body;
        
        const review = await CardChangeReviewModel.reject(req.params.id, req.user.id, note || '');

        res.json({
            success: true,
            data: review,
            message: '已驳回'
        });
    } catch (error) {
        console.error('Reject review error:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: error.message || '审核驳回失败'
        });
    }
});

router.get('/card/:cardId', auth, async (req, res) => {
    try {
        const reviews = await CardChangeReviewModel.getByCardId(req.params.cardId);

        res.json({
            success: true,
            data: reviews
        });
    } catch (error) {
        console.error('Get card reviews error:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '获取卡片审核记录失败'
        });
    }
});

module.exports = router;
