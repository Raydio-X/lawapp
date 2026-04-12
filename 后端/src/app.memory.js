require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const JWT_SECRET = process.env.JWT_SECRET || 'lawapp_jwt_secret_key_2024';

let users = [
    { id: 1, openid: 'mock_openid_test', nickname: '法硕考生', avatar: '', bio: '法硕备考中，每天进步一点点' },
    { id: 2, openid: 'mock_openid_user1', nickname: '法硕小王', avatar: '', bio: '刑法爱好者' },
    { id: 3, openid: 'mock_openid_user2', nickname: '考研党', avatar: '', bio: '民法专精' }
];

let libraries = [
    { id: 1, name: '2024法硕刑法总则', subject: '刑法', description: '刑法总则核心知识点', created_by: 1, is_public: 1, view_count: 100, favorite_count: 50, card_count: 7 },
    { id: 2, name: '民法典物权编重点', subject: '民法', description: '民法典物权编重点法条', created_by: 1, is_public: 1, view_count: 80, favorite_count: 40, card_count: 2 },
    { id: 3, name: '法理学核心概念', subject: '法理学', description: '法理学基础概念', created_by: 2, is_public: 1, view_count: 60, favorite_count: 30, card_count: 1 },
    { id: 4, name: '宪法条文速记', subject: '宪法', description: '宪法重要条文', created_by: 3, is_public: 1, view_count: 50, favorite_count: 25, card_count: 1 },
    { id: 5, name: '刑法分则罪名大全', subject: '刑法', description: '刑法分则各类罪名详解', created_by: 1, is_public: 1, view_count: 120, favorite_count: 60, card_count: 0 },
    { id: 6, name: '合同法精要', subject: '民法', description: '合同法核心知识点', created_by: 2, is_public: 1, view_count: 70, favorite_count: 35, card_count: 1 }
];

let chapters = [
    { id: 1, library_id: 1, name: '第一章 刑法概说', sort_order: 1 },
    { id: 2, library_id: 1, name: '第二章 犯罪概念', sort_order: 2 },
    { id: 3, library_id: 1, name: '第三章 犯罪构成', sort_order: 3 },
    { id: 4, library_id: 1, name: '第四章 正当化事由', sort_order: 4 },
    { id: 5, library_id: 1, name: '第五章 故意犯罪的停止形态', sort_order: 5 },
    { id: 6, library_id: 2, name: '第一章 物权概述', sort_order: 1 },
    { id: 7, library_id: 2, name: '第二章 所有权', sort_order: 2 },
    { id: 8, library_id: 3, name: '第一章 法的本质', sort_order: 1 },
    { id: 9, library_id: 3, name: '第二章 法律关系', sort_order: 2 }
];

let cards = [
    { id: 1, library_id: 1, chapter_id: 1, question: '刑法的概念与特征是什么？', answer: '刑法是规定犯罪、刑事责任和刑罚的法律规范的总和。其特征包括：\n1. 特定性：只规定犯罪与刑罚\n2. 严厉性：涉及生命、自由、财产等最重要的法益\n3. 补充性：只有在其他法律手段不足以保护法益时才适用\n4. 保障性：保障其他法律的实施', tags: ['基础', '概念', '必考'], created_by: 1, is_public: 1, view_count: 200, like_count: 50, study_count: 100 },
    { id: 2, library_id: 1, chapter_id: 1, question: '罪刑法定原则的基本内容是什么？', answer: '罪刑法定原则是指"法无明文规定不为罪，法无明文规定不处罚"。其基本内容包括：\n1. 成文法主义：禁止习惯法\n2. 禁止事后法：禁止溯及既往\n3. 禁止类推：禁止不利于被告人的类推解释\n4. 明确性原则：罪刑规范必须明确\n5. 禁止绝对不定期刑', tags: ['原则', '必考', '重点'], created_by: 1, is_public: 1, view_count: 180, like_count: 45, study_count: 90 },
    { id: 3, library_id: 1, chapter_id: 1, question: '刑法解释的种类有哪些？', answer: '刑法解释按效力分为：\n1. 立法解释：全国人大常委会的解释\n2. 司法解释：最高法、最高检的解释\n3. 学理解释：学者、机构的解释（无法律效力）', tags: ['基础', '理解'], created_by: 1, is_public: 1, view_count: 150, like_count: 30, study_count: 70 },
    { id: 4, library_id: 1, chapter_id: 3, question: '什么是犯罪构成？', answer: '犯罪构成是刑法规定的，决定某一行为的社会危害性及其程度，而为该行为成立犯罪所必须具备的一切客观要件与主观要件的有机整体。\n\n犯罪构成四要件：\n1. 犯罪客体\n2. 犯罪客观方面\n3. 犯罪主体\n4. 犯罪主观方面', tags: ['基础', '重点'], created_by: 1, is_public: 1, view_count: 170, like_count: 40, study_count: 80 },
    { id: 5, library_id: 1, chapter_id: 4, question: '正当防卫的成立条件有哪些？', answer: '正当防卫的成立条件：\n1. 起因条件：存在不法侵害\n2. 时间条件：不法侵害正在进行\n3. 主观条件：具有防卫意图\n4. 对象条件：针对不法侵害人本人\n5. 限度条件：没有明显超过必要限度造成重大损害', tags: ['重点', '必考', '难点'], created_by: 1, is_public: 1, view_count: 220, like_count: 60, study_count: 120 },
    { id: 6, library_id: 1, chapter_id: 5, question: '犯罪未遂的概念与特征是什么？', answer: '犯罪未遂是指已经着手实行犯罪，由于犯罪分子意志以外的原因而未得逞的犯罪形态。', tags: ['重点', '必考'], created_by: 1, is_public: 1, view_count: 160, like_count: 35, study_count: 75 },
    { id: 7, library_id: 1, chapter_id: 5, question: '犯罪中止的概念与特征是什么？', answer: '犯罪中止是指在犯罪过程中，自动放弃犯罪或者自动有效地防止犯罪结果发生的犯罪形态。', tags: ['重点', '必考'], created_by: 1, is_public: 1, view_count: 155, like_count: 32, study_count: 72 },
    { id: 8, library_id: 2, chapter_id: 6, question: '物权的概念与特征是什么？', answer: '物权是指权利人依法对特定的物享有直接支配和排他的权利。\n\n特征：\n1. 支配性\n2. 排他性\n3. 绝对性\n4. 公示性', tags: ['基础', '概念'], created_by: 1, is_public: 1, view_count: 140, like_count: 28, study_count: 65 },
    { id: 9, library_id: 2, chapter_id: 7, question: '所有权的权能有哪些？', answer: '所有权的权能包括：\n1. 占有权能\n2. 使用权能\n3. 收益权能\n4. 处分权能', tags: ['基础', '重点'], created_by: 1, is_public: 1, view_count: 130, like_count: 25, study_count: 60 },
    { id: 10, library_id: 3, chapter_id: 9, question: '法律关系的构成要素包括哪些？', answer: '法律关系由三个要素构成：\n1. 主体：法律关系的参加者\n2. 客体：权利义务指向的对象\n3. 内容：主体之间的权利和义务', tags: ['基础', '概念'], created_by: 2, is_public: 1, view_count: 120, like_count: 22, study_count: 55 },
    { id: 11, library_id: 4, chapter_id: null, question: '宪法中公民的基本权利有哪些？', answer: '公民基本权利主要包括：\n1. 平等权\n2. 政治权利和自由\n3. 宗教信仰自由\n4. 人身自由权\n5. 社会经济权利\n6. 监督权和取得赔偿权', tags: ['宪法', '简答题'], created_by: 3, is_public: 1, view_count: 110, like_count: 20, study_count: 50 },
    { id: 12, library_id: 6, chapter_id: null, question: '民法典合同编的违约责任规定', answer: '违约责任的承担方式包括：\n1. 继续履行\n2. 采取补救措施\n3. 赔偿损失\n4. 违约金\n5. 定金罚则', tags: ['民法', '重点'], created_by: 2, is_public: 1, view_count: 100, like_count: 18, study_count: 45 }
];

let comments = [
    { id: 1, card_id: 1, user_id: 2, content: '刑法的补充性特征很重要，要记住是最后手段！', like_count: 5, created_at: new Date(Date.now() - 2 * 60 * 60 * 1000) },
    { id: 2, card_id: 1, user_id: 3, content: '四个特征可以用"特严补保"来记忆', like_count: 3, created_at: new Date(Date.now() - 5 * 60 * 60 * 1000) },
    { id: 3, card_id: 2, user_id: 2, content: '罪刑法定原则是刑法最重要的原则！', like_count: 2, created_at: new Date(Date.now() - 8 * 60 * 60 * 1000) },
    { id: 4, card_id: 5, user_id: 3, content: '正当防卫的五个条件要分清楚', like_count: 4, created_at: new Date(Date.now() - 10 * 60 * 60 * 1000) }
];

let favorites = [];
let wrongCards = [];
let studyRecords = [];
let userStats = { 1: { total_study_days: 15, current_streak: 7, longest_streak: 10, total_cards_learned: 50 } };

let nextUserId = 4;
let nextLibraryId = 7;
let nextCardId = 13;
let nextCommentId = 5;

function auth(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, code: 401, message: '未登录' });
        }
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ success: false, code: 401, message: '登录已过期' });
    }
}

app.get('/', (req, res) => {
    res.json({
        success: true,
        message: '法硕背诵小程序 API 服务',
        version: '1.0.0 (内存模式)',
        endpoints: {
            auth: '/api/auth',
            libraries: '/api/libraries',
            cards: '/api/cards',
            study: '/api/study'
        }
    });
});

app.get('/health', (req, res) => {
    res.json({ success: true, message: 'OK', timestamp: new Date().toISOString() });
});

// Auth routes
app.post('/api/auth/login', (req, res) => {
    try {
        const { code, userInfo } = req.body;
        const openid = 'mock_openid_' + code;
        
        let user = users.find(u => u.openid === openid);
        if (!user) {
            user = {
                id: nextUserId++,
                openid,
                nickname: userInfo?.nickName || '微信用户',
                avatar: userInfo?.avatarUrl || '',
                bio: ''
            };
            users.push(user);
        }

        const token = jwt.sign({ id: user.id, openid: user.openid }, JWT_SECRET, { expiresIn: '7d' });

        res.json({
            success: true,
            data: {
                token,
                userInfo: { id: user.id, nickname: user.nickname, avatar: user.avatar, bio: user.bio }
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, code: 500, message: '登录失败' });
    }
});

app.get('/api/auth/me', auth, (req, res) => {
    const user = users.find(u => u.id === req.user.id);
    if (!user) return res.status(404).json({ success: false, code: 404, message: '用户不存在' });
    res.json({ success: true, data: { id: user.id, nickname: user.nickname, avatar: user.avatar, bio: user.bio } });
});

app.put('/api/auth/profile', auth, (req, res) => {
    const user = users.find(u => u.id === req.user.id);
    if (!user) return res.status(404).json({ success: false, code: 404, message: '用户不存在' });
    if (req.body.nickname) user.nickname = req.body.nickname;
    if (req.body.avatar) user.avatar = req.body.avatar;
    if (req.body.bio) user.bio = req.body.bio;
    res.json({ success: true, data: { id: user.id, nickname: user.nickname, avatar: user.avatar, bio: user.bio } });
});

// Library routes
app.get('/api/libraries', (req, res) => {
    const { page = 1, pageSize = 10, subject } = req.query;
    let filtered = libraries.filter(l => l.is_public === 1);
    if (subject) filtered = filtered.filter(l => l.subject === subject);
    
    const total = filtered.length;
    const list = filtered.slice((page - 1) * pageSize, page * pageSize);
    
    res.json({
        success: true,
        data: {
            list: list.map(l => ({ ...l, creator_name: users.find(u => u.id === l.created_by)?.nickname || '' })),
            pagination: { page: parseInt(page), pageSize: parseInt(pageSize), total, totalPages: Math.ceil(total / pageSize) }
        }
    });
});

app.get('/api/libraries/my', auth, (req, res) => {
    const { page = 1, pageSize = 10 } = req.query;
    const filtered = libraries.filter(l => l.created_by === req.user.id);
    const total = filtered.length;
    const list = filtered.slice((page - 1) * pageSize, page * pageSize);
    res.json({ success: true, data: { list, pagination: { page: parseInt(page), pageSize: parseInt(pageSize), total, totalPages: Math.ceil(total / pageSize) } } });
});

app.get('/api/libraries/recommended', (req, res) => {
    const { limit = 6 } = req.query;
    const recommended = [...libraries].sort((a, b) => b.view_count - a.view_count).slice(0, parseInt(limit));
    res.json({ success: true, data: recommended.map(l => ({ ...l, creator_name: users.find(u => u.id === l.created_by)?.nickname || '' })) });
});

app.get('/api/libraries/categories', (req, res) => {
    const categories = {};
    libraries.filter(l => l.is_public === 1).forEach(l => {
        categories[l.subject] = (categories[l.subject] || 0) + 1;
    });
    res.json({ success: true, data: Object.entries(categories).map(([subject, count]) => ({ subject, count })) });
});

app.get('/api/libraries/:id', (req, res) => {
    const library = libraries.find(l => l.id === parseInt(req.params.id));
    if (!library) return res.status(404).json({ success: false, code: 404, message: '知识库不存在' });
    library.view_count++;
    const libraryChapters = chapters.filter(c => c.library_id === library.id);
    res.json({ success: true, data: { ...library, chapters: libraryChapters, creator_name: users.find(u => u.id === library.created_by)?.nickname || '' } });
});

app.post('/api/libraries', auth, (req, res) => {
    const { name, subject, description, is_public } = req.body;
    if (!name || !subject) return res.status(400).json({ success: false, code: 400, message: '名称和学科不能为空' });
    
    const library = {
        id: nextLibraryId++,
        name, subject,
        description: description || '',
        created_by: req.user.id,
        is_public: is_public !== undefined ? is_public : 1,
        view_count: 0,
        favorite_count: 0,
        card_count: 0
    };
    libraries.push(library);
    res.status(201).json({ success: true, data: library });
});

app.put('/api/libraries/:id', auth, (req, res) => {
    const library = libraries.find(l => l.id === parseInt(req.params.id));
    if (!library) return res.status(404).json({ success: false, code: 404, message: '知识库不存在' });
    if (library.created_by !== req.user.id) return res.status(403).json({ success: false, code: 403, message: '无权修改' });
    
    if (req.body.name) library.name = req.body.name;
    if (req.body.subject) library.subject = req.body.subject;
    if (req.body.description !== undefined) library.description = req.body.description;
    
    res.json({ success: true, data: library });
});

app.delete('/api/libraries/:id', auth, (req, res) => {
    const index = libraries.findIndex(l => l.id === parseInt(req.params.id) && l.created_by === req.user.id);
    if (index === -1) return res.status(404).json({ success: false, code: 404, message: '知识库不存在或无权删除' });
    libraries.splice(index, 1);
    res.json({ success: true, message: '删除成功' });
});

app.post('/api/libraries/:id/favorite', auth, (req, res) => {
    const existingIndex = favorites.findIndex(f => f.user_id === req.user.id && f.target_type === 'library' && f.target_id === parseInt(req.params.id));
    if (existingIndex > -1) {
        favorites.splice(existingIndex, 1);
        res.json({ success: true, data: { isFavorited: false } });
    } else {
        favorites.push({ user_id: req.user.id, target_type: 'library', target_id: parseInt(req.params.id) });
        res.json({ success: true, data: { isFavorited: true } });
    }
});

app.get('/api/libraries/:libraryId/chapters', (req, res) => {
    const libraryChapters = chapters.filter(c => c.library_id === parseInt(req.params.libraryId));
    res.json({ success: true, data: libraryChapters });
});

// Card routes
app.get('/api/cards', (req, res) => {
    const { page = 1, pageSize = 10, libraryId } = req.query;
    let filtered = cards.filter(c => c.is_public === 1);
    if (libraryId) filtered = filtered.filter(c => c.library_id === parseInt(libraryId));
    
    const total = filtered.length;
    const list = filtered.slice((page - 1) * pageSize, page * pageSize);
    
    res.json({
        success: true,
        data: {
            list: list.map(c => ({
                ...c,
                library_name: libraries.find(l => l.id === c.library_id)?.name || '',
                chapter_name: chapters.find(ch => ch.id === c.chapter_id)?.name || ''
            })),
            pagination: { page: parseInt(page), pageSize: parseInt(pageSize), total, totalPages: Math.ceil(total / pageSize) }
        }
    });
});

app.get('/api/cards/hot', (req, res) => {
    const { limit = 10 } = req.query;
    const hotCards = [...cards].sort((a, b) => b.study_count - a.study_count).slice(0, parseInt(limit));
    res.json({ success: true, data: hotCards.map(c => ({ ...c, library_name: libraries.find(l => l.id === c.library_id)?.name || '' })) });
});

app.get('/api/cards/search', (req, res) => {
    const { keyword, page = 1, pageSize = 10 } = req.query;
    if (!keyword) return res.status(400).json({ success: false, code: 400, message: '关键词不能为空' });
    
    const filtered = cards.filter(c => c.is_public === 1 && (c.question.includes(keyword) || c.answer.includes(keyword)));
    const total = filtered.length;
    const list = filtered.slice((page - 1) * pageSize, page * pageSize);
    
    res.json({ success: true, data: { list, pagination: { page: parseInt(page), pageSize: parseInt(pageSize), total, totalPages: Math.ceil(total / pageSize) } } });
});

app.get('/api/cards/:id', (req, res) => {
    const card = cards.find(c => c.id === parseInt(req.params.id));
    if (!card) return res.status(404).json({ success: false, code: 404, message: '卡片不存在' });
    res.json({ success: true, data: { ...card, library_name: libraries.find(l => l.id === card.library_id)?.name || '' } });
});

app.post('/api/cards', auth, (req, res) => {
    const { library_id, chapter_id, question, answer, tags, is_public } = req.body;
    if (!library_id || !question || !answer) return res.status(400).json({ success: false, code: 400, message: '知识库、问题和答案不能为空' });
    
    const card = {
        id: nextCardId++,
        library_id: parseInt(library_id),
        chapter_id: chapter_id ? parseInt(chapter_id) : null,
        question, answer,
        tags: tags || [],
        created_by: req.user.id,
        is_public: is_public !== undefined ? is_public : 1,
        view_count: 0, like_count: 0, study_count: 0
    };
    cards.push(card);
    
    const library = libraries.find(l => l.id === parseInt(library_id));
    if (library) library.card_count++;
    
    res.status(201).json({ success: true, data: card });
});

app.put('/api/cards/:id', auth, (req, res) => {
    const card = cards.find(c => c.id === parseInt(req.params.id));
    if (!card) return res.status(404).json({ success: false, code: 404, message: '卡片不存在' });
    if (card.created_by !== req.user.id) return res.status(403).json({ success: false, code: 403, message: '无权修改' });
    
    if (req.body.question) card.question = req.body.question;
    if (req.body.answer) card.answer = req.body.answer;
    if (req.body.tags) card.tags = req.body.tags;
    
    res.json({ success: true, data: card });
});

app.delete('/api/cards/:id', auth, (req, res) => {
    const index = cards.findIndex(c => c.id === parseInt(req.params.id) && c.created_by === req.user.id);
    if (index === -1) return res.status(404).json({ success: false, code: 404, message: '卡片不存在或无权删除' });
    
    const card = cards[index];
    const library = libraries.find(l => l.id === card.library_id);
    if (library) library.card_count--;
    
    cards.splice(index, 1);
    res.json({ success: true, message: '删除成功' });
});

app.post('/api/cards/:id/study', auth, (req, res) => {
    const card = cards.find(c => c.id === parseInt(req.params.id));
    if (!card) return res.status(404).json({ success: false, code: 404, message: '卡片不存在' });
    
    card.study_count++;
    studyRecords.push({
        user_id: req.user.id,
        card_id: card.id,
        library_id: card.library_id,
        feedback: req.body.feedback || 'normal',
        created_at: new Date()
    });
    
    if (!userStats[req.user.id]) {
        userStats[req.user.id] = { total_study_days: 1, current_streak: 1, longest_streak: 1, total_cards_learned: 1 };
    } else {
        userStats[req.user.id].total_cards_learned++;
    }
    
    res.json({ success: true, message: '学习记录已保存' });
});

app.get('/api/cards/:id/next', (req, res) => {
    const card = cards.find(c => c.id === parseInt(req.params.id));
    if (!card) return res.status(404).json({ success: false, code: 404, message: '卡片不存在' });
    
    const nextCard = cards.find(c => c.library_id === card.library_id && c.id > card.id);
    res.json({ success: true, data: nextCard || null });
});

app.get('/api/cards/:id/prev', (req, res) => {
    const card = cards.find(c => c.id === parseInt(req.params.id));
    if (!card) return res.status(404).json({ success: false, code: 404, message: '卡片不存在' });
    
    const prevCards = cards.filter(c => c.library_id === card.library_id && c.id < card.id);
    const prevCard = prevCards.length > 0 ? prevCards[prevCards.length - 1] : null;
    res.json({ success: true, data: prevCard });
});

// Comment routes
app.get('/api/cards/:cardId/comments', (req, res) => {
    const { page = 1, pageSize = 10 } = req.query;
    const cardComments = comments.filter(c => c.card_id === parseInt(req.params.cardId));
    const total = cardComments.length;
    const list = cardComments.slice((page - 1) * pageSize, page * pageSize);
    
    res.json({
        success: true,
        data: {
            list: list.map(c => ({ ...c, nickname: users.find(u => u.id === c.user_id)?.nickname || '', avatar: users.find(u => u.id === c.user_id)?.avatar || '' })),
            pagination: { page: parseInt(page), pageSize: parseInt(pageSize), total, totalPages: Math.ceil(total / pageSize) }
        }
    });
});

app.post('/api/cards/:cardId/comments', auth, (req, res) => {
    const { content } = req.body;
    if (!content) return res.status(400).json({ success: false, code: 400, message: '内容不能为空' });
    
    const comment = {
        id: nextCommentId++,
        card_id: parseInt(req.params.cardId),
        user_id: req.user.id,
        content,
        like_count: 0,
        created_at: new Date()
    };
    comments.push(comment);
    
    res.status(201).json({ success: true, data: { ...comment, nickname: users.find(u => u.id === req.user.id)?.nickname || '', avatar: users.find(u => u.id === req.user.id)?.avatar || '' } });
});

// Study routes
app.get('/api/study/stats', auth, (req, res) => {
    const stats = userStats[req.user.id] || { total_study_days: 0, current_streak: 0, longest_streak: 0, total_cards_learned: 0 };
    const todayRecords = studyRecords.filter(r => r.user_id === req.user.id && new Date(r.created_at).toDateString() === new Date().toDateString());
    
    res.json({
        success: true,
        data: {
            ...stats,
            todayCards: todayRecords.length,
            libraryCount: libraries.filter(l => l.created_by === req.user.id).length
        }
    });
});

app.get('/api/study/today', auth, (req, res) => {
    const todayRecords = studyRecords.filter(r => r.user_id === req.user.id && new Date(r.created_at).toDateString() === new Date().toDateString());
    res.json({ success: true, data: todayRecords });
});

app.get('/api/study/recent', auth, (req, res) => {
    const { limit = 10 } = req.query;
    const recentRecords = studyRecords.filter(r => r.user_id === req.user.id).slice(-parseInt(limit));
    res.json({ success: true, data: recentRecords });
});

// Favorites routes
app.get('/api/favorites', auth, (req, res) => {
    const userFavorites = favorites.filter(f => f.user_id === req.user.id);
    res.json({ success: true, data: { list: userFavorites, pagination: { page: 1, pageSize: 10, total: userFavorites.length, totalPages: 1 } } });
});

app.post('/api/favorites/toggle', auth, (req, res) => {
    const { targetType, targetId } = req.body;
    const existingIndex = favorites.findIndex(f => f.user_id === req.user.id && f.target_type === targetType && f.target_id === targetId);
    
    if (existingIndex > -1) {
        favorites.splice(existingIndex, 1);
        res.json({ success: true, data: { isFavorited: false } });
    } else {
        favorites.push({ user_id: req.user.id, target_type: targetType, target_id: targetId });
        res.json({ success: true, data: { isFavorited: true } });
    }
});

// Wrong cards routes
app.get('/api/wrong-cards', auth, (req, res) => {
    const userWrongCards = wrongCards.filter(w => w.user_id === req.user.id);
    res.json({ success: true, data: { list: userWrongCards, pagination: { page: 1, pageSize: 10, total: userWrongCards.length, totalPages: 1 } } });
});

app.post('/api/wrong-cards/:cardId/master', auth, (req, res) => {
    const wrongCard = wrongCards.find(w => w.user_id === req.user.id && w.card_id === parseInt(req.params.cardId));
    if (wrongCard) wrongCard.is_mastered = 1;
    res.json({ success: true, message: '已标记为掌握' });
});

// Error handling
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ success: false, code: 500, message: err.message || '服务器错误' });
});

app.use((req, res) => {
    res.status(404).json({ success: false, code: 404, message: '接口不存在' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`API Base URL: http://localhost:${PORT}/api`);
    console.log(`Mode: In-memory storage (no database required)`);
});

module.exports = app;
