require('dotenv').config();
const db = require('../config/database');

const mockUsers = [
    { openid: 'mock_openid_test', nickname: '法硕考生', avatar: '', bio: '法硕备考中，每天进步一点点' },
    { openid: 'mock_openid_user1', nickname: '法硕小王', avatar: '', bio: '刑法爱好者' },
    { openid: 'mock_openid_user2', nickname: '考研党', avatar: '', bio: '民法专精' },
    { openid: 'mock_openid_user3', nickname: '法学生', avatar: '', bio: '法理学研究' }
];

const mockLibraries = [
    { name: '2024法硕刑法总则', subject: '刑法', description: '刑法总则核心知识点，包含犯罪构成、刑罚体系等内容', created_by: 1 },
    { name: '民法典物权编重点', subject: '民法', description: '民法典物权编重点法条和知识点梳理', created_by: 1 },
    { name: '法理学核心概念', subject: '法理学', description: '法理学基础概念和原理', created_by: 2 },
    { name: '宪法条文速记', subject: '宪法', description: '宪法重要条文和知识点', created_by: 3 },
    { name: '刑法分则罪名大全', subject: '刑法', description: '刑法分则各类罪名详解', created_by: 1 },
    { name: '合同法精要', subject: '民法', description: '合同法核心知识点', created_by: 2 }
];

const mockChapters = [
    { library_id: 1, name: '第一章 刑法概说', sort_order: 1 },
    { library_id: 1, name: '第二章 犯罪概念', sort_order: 2 },
    { library_id: 1, name: '第三章 犯罪构成', sort_order: 3 },
    { library_id: 1, name: '第四章 正当化事由', sort_order: 4 },
    { library_id: 1, name: '第五章 故意犯罪的停止形态', sort_order: 5 },
    { library_id: 2, name: '第一章 物权概述', sort_order: 1 },
    { library_id: 2, name: '第二章 所有权', sort_order: 2 },
    { library_id: 3, name: '第一章 法的本质', sort_order: 1 },
    { library_id: 3, name: '第二章 法律关系', sort_order: 2 }
];

const mockCards = [
    {
        library_id: 1,
        chapter_id: 1,
        question: '刑法的概念与特征是什么？',
        answer: '刑法是规定犯罪、刑事责任和刑罚的法律规范的总和。其特征包括：\n1. 特定性：只规定犯罪与刑罚\n2. 严厉性：涉及生命、自由、财产等最重要的法益\n3. 补充性：只有在其他法律手段不足以保护法益时才适用\n4. 保障性：保障其他法律的实施',
        tags: ['基础', '概念', '必考'],
        created_by: 1
    },
    {
        library_id: 1,
        chapter_id: 1,
        question: '罪刑法定原则的基本内容是什么？',
        answer: '罪刑法定原则是指"法无明文规定不为罪，法无明文规定不处罚"。其基本内容包括：\n1. 成文法主义：禁止习惯法\n2. 禁止事后法：禁止溯及既往\n3. 禁止类推：禁止不利于被告人的类推解释\n4. 明确性原则：罪刑规范必须明确\n5. 禁止绝对不定期刑',
        tags: ['原则', '必考', '重点'],
        created_by: 1
    },
    {
        library_id: 1,
        chapter_id: 1,
        question: '刑法解释的种类有哪些？',
        answer: '刑法解释按效力分为：\n1. 立法解释：全国人大常委会的解释\n2. 司法解释：最高法、最高检的解释\n3. 学理解释：学者、机构的解释（无法律效力）\n\n按方法分为：\n1. 文理解释：按文字含义解释\n2. 论理解释：按立法精神解释（扩张、限制、当然、历史、比较、目的解释等）',
        tags: ['基础', '理解'],
        created_by: 1
    },
    {
        library_id: 1,
        chapter_id: 3,
        question: '什么是犯罪构成？',
        answer: '犯罪构成是刑法规定的，决定某一行为的社会危害性及其程度，而为该行为成立犯罪所必须具备的一切客观要件与主观要件的有机整体。\n\n犯罪构成四要件：\n1. 犯罪客体\n2. 犯罪客观方面\n3. 犯罪主体\n4. 犯罪主观方面',
        tags: ['基础', '重点'],
        created_by: 1
    },
    {
        library_id: 1,
        chapter_id: 4,
        question: '正当防卫的成立条件有哪些？',
        answer: '正当防卫的成立条件：\n1. 起因条件：存在不法侵害\n2. 时间条件：不法侵害正在进行\n3. 主观条件：具有防卫意图\n4. 对象条件：针对不法侵害人本人\n5. 限度条件：没有明显超过必要限度造成重大损害\n\n特殊防卫：对正在进行行凶、杀人、抢劫、强奸、绑架以及其他严重危及人身安全的暴力犯罪，采取防卫行为，造成不法侵害人伤亡的，不属于防卫过当。',
        tags: ['重点', '必考', '难点'],
        created_by: 1
    },
    {
        library_id: 1,
        chapter_id: 5,
        question: '犯罪未遂的概念与特征是什么？',
        answer: '犯罪未遂是指已经着手实行犯罪，由于犯罪分子意志以外的原因而未得逞的犯罪形态。\n\n特征：\n1. 已经着手实行犯罪\n2. 犯罪未得逞\n3. 犯罪未得逞是由于犯罪分子意志以外的原因\n\n处罚原则：可以比照既遂犯从轻或者减轻处罚。',
        tags: ['重点', '必考'],
        created_by: 1
    },
    {
        library_id: 1,
        chapter_id: 5,
        question: '犯罪中止的概念与特征是什么？',
        answer: '犯罪中止是指在犯罪过程中，自动放弃犯罪或者自动有效地防止犯罪结果发生的犯罪形态。\n\n特征：\n1. 时空性：必须发生在犯罪过程中\n2. 自动性：自动放弃犯罪意图\n3. 客观性：客观上有中止行为\n4. 有效性：有效地防止犯罪结果发生\n\n处罚原则：没有造成损害的，应当免除处罚；造成损害的，应当减轻处罚。',
        tags: ['重点', '必考'],
        created_by: 1
    },
    {
        library_id: 2,
        chapter_id: 6,
        question: '物权的概念与特征是什么？',
        answer: '物权是指权利人依法对特定的物享有直接支配和排他的权利。\n\n特征：\n1. 支配性：权利人可以直接支配标的物\n2. 排他性：同一物上不能存在两个内容相同的物权\n3. 绝对性：义务主体是不特定的\n4. 公示性：物权变动需要公示',
        tags: ['基础', '概念'],
        created_by: 1
    },
    {
        library_id: 2,
        chapter_id: 7,
        question: '所有权的权能有哪些？',
        answer: '所有权的权能包括：\n1. 占有权能：对物进行实际控制\n2. 使用权能：按照物的性能和用途使用\n3. 收益权能：获取物的孳息\n4. 处分权能：决定物的事实上和法律上的命运\n\n这四项权能可以与所有权分离，但所有权人仍保留最终处分权。',
        tags: ['基础', '重点'],
        created_by: 1
    },
    {
        library_id: 3,
        chapter_id: 8,
        question: '法律关系的构成要素包括哪些？',
        answer: '法律关系由三个要素构成：\n\n1. 主体：法律关系的参加者（自然人、法人、国家）\n2. 客体：权利义务指向的对象（物、行为、智力成果、人身利益）\n3. 内容：主体之间的权利和义务\n\n三者缺一不可，共同构成完整的法律关系。',
        tags: ['基础', '概念'],
        created_by: 2
    },
    {
        library_id: 1,
        chapter_id: 2,
        question: '刑法中正当防卫的构成要件有哪些？',
        answer: '正当防卫的构成要件包括五个方面：\n\n1. 起因条件：存在现实的不法侵害\n2. 时间条件：不法侵害正在进行\n3. 主观条件：具有防卫意识\n4. 对象条件：针对不法侵害人本人\n5. 限度条件：没有明显超过必要限度\n\n记忆口诀："现进防本限"（现进房本现）',
        tags: ['刑法', '简答题'],
        created_by: 1
    },
    {
        library_id: 2,
        chapter_id: 6,
        question: '民法典合同编的违约责任规定',
        answer: '违约责任的承担方式包括：\n\n1. 继续履行\n2. 采取补救措施\n3. 赔偿损失\n4. 违约金\n5. 定金罚则\n\n注意：违约金和定金不能同时适用，只能择一主张。',
        tags: ['民法', '重点'],
        created_by: 1
    },
    {
        library_id: 4,
        chapter_id: null,
        question: '宪法中公民的基本权利有哪些？',
        answer: '公民基本权利主要包括：\n\n1. 平等权\n2. 政治权利和自由（选举权、言论自由等）\n3. 宗教信仰自由\n4. 人身自由权\n5. 社会经济权利（劳动权、受教育权等）\n6. 监督权和取得赔偿权\n\n这些权利是公民最基本的权利，受宪法保护。',
        tags: ['宪法', '简答题'],
        created_by: 3
    },
    {
        library_id: 5,
        chapter_id: null,
        question: '法制史：唐律疏议的历史地位',
        answer: '《唐律疏议》的历史地位：\n\n1. 是中国历史上第一部完整保存下来的封建法典\n2. 标志着中国古代立法的最高水平\n3. 对后世影响深远，宋、明、清各代法典均以其为蓝本\n4. 对东亚各国法律发展产生重要影响（日本、朝鲜、越南）\n\n被誉为"中华法系"的代表作。',
        tags: ['法制史', '论述'],
        created_by: 1
    }
];

const mockComments = [
    { card_id: 1, user_id: 2, content: '刑法的补充性特征很重要，要记住是最后手段！' },
    { card_id: 1, user_id: 3, content: '四个特征可以用"特严补保"来记忆' },
    { card_id: 2, user_id: 2, content: '罪刑法定原则是刑法最重要的原则，必须牢记！' },
    { card_id: 5, user_id: 3, content: '正当防卫的五个条件要分清楚，考试经常考' }
];

async function seedDatabase() {
    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        console.log('开始插入模拟数据...');

        for (const user of mockUsers) {
            await connection.execute(
                'INSERT INTO users (openid, nickname, avatar, bio) VALUES (?, ?, ?, ?)',
                [user.openid, user.nickname, user.avatar, user.bio]
            );
        }
        console.log(`✓ 插入 ${mockUsers.length} 个用户`);

        for (const library of mockLibraries) {
            await connection.execute(
                'INSERT INTO libraries (name, subject, description, created_by, card_count) VALUES (?, ?, ?, ?, 0)',
                [library.name, library.subject, library.description, library.created_by]
            );
        }
        console.log(`✓ 插入 ${mockLibraries.length} 个知识库`);

        for (const chapter of mockChapters) {
            await connection.execute(
                'INSERT INTO chapters (library_id, name, sort_order) VALUES (?, ?, ?)',
                [chapter.library_id, chapter.name, chapter.sort_order]
            );
        }
        console.log(`✓ 插入 ${mockChapters.length} 个章节`);

        for (const card of mockCards) {
            await connection.execute(
                'INSERT INTO cards (library_id, chapter_id, question, answer, tags, created_by) VALUES (?, ?, ?, ?, ?, ?)',
                [card.library_id, card.chapter_id, card.question, card.answer, JSON.stringify(card.tags), card.created_by]
            );
        }
        console.log(`✓ 插入 ${mockCards.length} 张卡片`);

        for (const library of mockLibraries) {
            const [rows] = await connection.execute(
                'SELECT COUNT(*) as count FROM cards WHERE library_id = ?',
                [mockLibraries.indexOf(library) + 1]
            );
            await connection.execute(
                'UPDATE libraries SET card_count = ? WHERE id = ?',
                [rows[0].count, mockLibraries.indexOf(library) + 1]
            );
        }

        for (const comment of mockComments) {
            await connection.execute(
                'INSERT INTO comments (card_id, user_id, content) VALUES (?, ?, ?)',
                [comment.card_id, comment.user_id, comment.content]
            );
        }
        console.log(`✓ 插入 ${mockComments.length} 条评论`);

        await connection.execute(
            'INSERT INTO user_stats (user_id, total_study_days, current_streak, longest_streak, last_study_date, total_cards_learned) VALUES (1, 15, 7, 10, CURDATE(), 50)'
        );
        console.log('✓ 插入用户统计数据');

        await connection.commit();
        console.log('\n✅ 模拟数据插入完成！');
        
        console.log('\n测试账号信息:');
        console.log('- openid: mock_openid_test');
        console.log('- nickname: 法硕考生');
        
    } catch (error) {
        await connection.rollback();
        console.error('❌ 插入模拟数据失败:', error);
        throw error;
    } finally {
        if (connection) {
            connection.release();
        }
        await db.end();
    }
}

seedDatabase();
