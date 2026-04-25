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

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/icons', express.static(path.join(__dirname, '../icons')));

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

app.use((err, req, res, next) => {
    console.error('Error:', err);
    console.error('Stack:', err.stack);
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
