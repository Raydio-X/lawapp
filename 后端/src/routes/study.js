const express = require('express');
const StudyModel = require('../models/Study');
const UserModel = require('../models/User');
const { auth } = require('../middlewares/auth');

const router = express.Router();

router.get('/stats', auth, async (req, res) => {
    try {
        const stats = await StudyModel.getStats(req.user.id);

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Get study stats error:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '获取学习统计失败'
        });
    }
});

router.get('/today', auth, async (req, res) => {
    try {
        const records = await StudyModel.getTodayRecords(req.user.id);

        res.json({
            success: true,
            data: records
        });
    } catch (error) {
        console.error('Get today records error:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '获取今日学习记录失败'
        });
    }
});

router.get('/calendar', auth, async (req, res) => {
    try {
        const { year, month } = req.query;
        
        const calendar = await StudyModel.getCalendar(
            req.user.id,
            parseInt(year) || new Date().getFullYear(),
            parseInt(month) || new Date().getMonth() + 1
        );

        res.json({
            success: true,
            data: calendar
        });
    } catch (error) {
        console.error('Get calendar error:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '获取学习日历失败'
        });
    }
});

router.get('/progress/:libraryId', auth, async (req, res) => {
    try {
        const progress = await StudyModel.getLibraryProgress(req.user.id, req.params.libraryId);

        res.json({
            success: true,
            data: progress
        });
    } catch (error) {
        console.error('Get progress error:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '获取学习进度失败'
        });
    }
});

router.get('/recent', auth, async (req, res) => {
    try {
        const { limit } = req.query;
        
        const cards = await StudyModel.getRecentCards(req.user.id, parseInt(limit) || 10);

        res.json({
            success: true,
            data: cards
        });
    } catch (error) {
        console.error('Get recent cards error:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '获取最近学习失败'
        });
    }
});

router.get('/trend', auth, async (req, res) => {
    try {
        const { days } = req.query;
        
        const trend = await StudyModel.getTrend(req.user.id, parseInt(days) || 7);

        res.json({
            success: true,
            data: trend
        });
    } catch (error) {
        console.error('Get trend error:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '获取学习趋势失败'
        });
    }
});

router.get('/heatmap', auth, async (req, res) => {
    try {
        const { year } = req.query;
        
        const heatmap = await StudyModel.getHeatmap(req.user.id, parseInt(year) || new Date().getFullYear());

        res.json({
            success: true,
            data: heatmap
        });
    } catch (error) {
        console.error('Get heatmap error:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '获取学习热力图失败'
        });
    }
});

router.get('/monthly-stats', auth, async (req, res) => {
    try {
        const { year, month } = req.query;
        
        const stats = await StudyModel.getMonthlyStats(
            req.user.id,
            parseInt(year) || new Date().getFullYear(),
            parseInt(month) || new Date().getMonth() + 1
        );

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Get monthly stats error:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '获取月度统计失败'
        });
    }
});

router.get('/monthly-avg-stats', auth, async (req, res) => {
    try {
        const { year, month } = req.query;

        const stats = await StudyModel.getMonthlyAvgStats(
            parseInt(year) || new Date().getFullYear(),
            parseInt(month) || new Date().getMonth() + 1
        );

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Get monthly avg stats error:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '获取月度平均统计失败'
        });
    }
});

router.post('/time', auth, async (req, res) => {
    try {
        const { libraryId, duration } = req.body;
        
        if (!duration || duration <= 0) {
            return res.status(400).json({
                success: false,
                code: 400,
                message: '学习时长无效'
            });
        }

        const result = await StudyModel.recordStudyTime(req.user.id, libraryId || null, duration);

        res.json({
            success: true,
            data: {
                todayStudyTime: result.duration
            }
        });
    } catch (error) {
        console.error('Record study time error:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '记录学习时间失败'
        });
    }
});

router.get('/time', auth, async (req, res) => {
    try {
        const stats = await StudyModel.getStudyTimeStats(req.user.id);

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Get study time error:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '获取学习时间失败'
        });
    }
});

router.get('/today-time', auth, async (req, res) => {
    try {
        const result = await StudyModel.getTodayStudyTime(req.user.id);

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Get today study time error:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '获取今日学习时间失败'
        });
    }
});

router.put('/daily-goal', auth, async (req, res) => {
    try {
        const { goal } = req.body;
        
        if (!goal || goal < 10 || goal > 70) {
            return res.status(400).json({
                success: false,
                code: 400,
                message: '每日目标必须在10-70之间'
            });
        }

        await UserModel.updateDailyGoal(req.user.id, goal);

        res.json({
            success: true,
            data: { dailyGoal: goal }
        });
    } catch (error) {
        console.error('Update daily goal error:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '设置每日目标失败'
        });
    }
});

module.exports = router;
