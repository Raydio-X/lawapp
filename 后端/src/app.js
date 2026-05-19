require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const libraryRoutes = require('./routes/libraries');
const cardRoutes = require('./routes/cards');
const chapterRoutes = require('./routes/chapters');
const studyRoutes = require('./routes/study');
const commentRoutes = require('./routes/comments');
const favoriteRoutes = require('./routes/favorites');
const examRoutes = require('./routes/exam');
const adminRoutes = require('./routes/admin');
const messageRoutes = require('./routes/messages');
const feedbackRoutes = require('./routes/feedback');
const activationRoutes = require('./routes/activation');
const knowledgePackRoutes = require('./routes/knowledgePacks');
const cardChangeReviewRoutes = require('./routes/cardChangeReviews');

const app = express();

const allowedOrigins = process.env.CORS_ORIGIN 
    ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
    : [
        'http://localhost:5173',
        'http://localhost:3000',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:3000',
        'https://www.lawapp.top',
        'http://www.lawapp.top'
    ];

const corsOptions = {
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/icons', express.static(path.join(__dirname, '../icons')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/', (req, res) => {
    res.json({
        success: true,
        message: '法硕背诵小程序 API 服务',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            libraries: '/api/libraries',
            cards: '/api/cards',
            chapters: '/api/chapters',
            study: '/api/study',
            comments: '/api/comments',
            favorites: '/api/favorites',
            exam: '/api/exam',
            admin: '/api/admin',
            messages: '/api/messages'
        }
    });
});

app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'OK',
        timestamp: new Date().toISOString()
    });
});

app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'OK',
        timestamp: new Date().toISOString()
    });
});

app.use('/api/auth', authRoutes);
app.use('/api/libraries', libraryRoutes);
app.use('/api/cards', cardRoutes);
app.use('/api/chapters', chapterRoutes);
app.use('/api/study', studyRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/exam', examRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/activation', activationRoutes);
app.use('/api/knowledge-packs', knowledgePackRoutes);
app.use('/api/card-change-reviews', cardChangeReviewRoutes);

app.use((err, req, res, next) => {
    console.error('Error:', err);
    console.error('Stack:', err.stack);
    
    if (err.name === 'MulterError') {
        let message = '文件上传失败';
        if (err.code === 'LIMIT_FILE_SIZE') {
            message = '文件大小超过限制（最大50MB）';
        } else if (err.code === 'LIMIT_FILE_COUNT') {
            message = '文件数量超过限制';
        } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            message = '意外的文件字段';
        }
        return res.status(400).json({
            success: false,
            code: 400,
            message
        });
    }
    
    if (err.message === '只支持PDF格式文件') {
        return res.status(400).json({
            success: false,
            code: 400,
            message: err.message
        });
    }
    
    res.status(500).json({
        success: false,
        code: 500,
        message: err.message || '服务器内部错误'
    });
});

app.use((req, res) => {
    res.status(404).json({
        success: false,
        code: 404,
        message: '接口不存在'
    });
});

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`API Base URL: http://localhost:${PORT}/api`);
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

module.exports = app;
