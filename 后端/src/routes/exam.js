const express = require('express');
const CardModel = require('../models/Card');
const { auth } = require('../middlewares/auth');

const router = express.Router();

router.post('/generate', auth, async (req, res) => {
    try {
        const { libraries, count, mode } = req.body;
        
        if (!libraries || libraries.length === 0) {
            return res.status(400).json({
                success: false,
                code: 400,
                message: '请选择知识库'
            });
        }

        if (!count || count < 1 || count > 100) {
            return res.status(400).json({
                success: false,
                code: 400,
                message: '题目数量无效'
            });
        }

        let allCards = [];
        
        for (const libraryId of libraries) {
            const result = await CardModel.getByLibraryId(libraryId, req.user.id);
            allCards = allCards.concat(result);
        }

        if (allCards.length === 0) {
            return res.status(400).json({
                success: false,
                code: 400,
                message: '所选知识库中没有卡片'
            });
        }

        let selectedCards = [];
        
        if (mode === 'random') {
            const shuffled = allCards.sort(() => Math.random() - 0.5);
            selectedCards = shuffled.slice(0, Math.min(count, shuffled.length));
        } else {
            selectedCards = allCards.slice(0, Math.min(count, allCards.length));
        }

        const questions = selectedCards.map(card => ({
            id: card.id,
            question: card.question,
            answer: card.answer,
            library_id: card.library_id,
            library_name: card.library_name
        }));

        res.json({
            success: true,
            data: questions
        });
    } catch (error) {
        console.error('Generate exam error:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '生成试卷失败'
        });
    }
});

router.post('/submit', auth, async (req, res) => {
    try {
        const { examId, answers, duration } = req.body;
        
        res.json({
            success: true,
            message: '考试结果已保存'
        });
    } catch (error) {
        console.error('Submit exam error:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '提交失败'
        });
    }
});

module.exports = router;
