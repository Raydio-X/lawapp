const db = require('../config/database');

async function seedData() {
    let connection;
    try {
        connection = await db.getConnection();
        console.log('Connected to MySQL server');

        await connection.query('USE lawapp');

        const [existingUsers] = await connection.query('SELECT id FROM users WHERE openid = ?', ['test_openid']);
        let userId;
        
        if (existingUsers.length === 0) {
            const [userResult] = await connection.query(
                'INSERT INTO users (openid, nickname, avatar) VALUES (?, ?, ?)',
                ['test_openid', '测试用户', 'https://via.placeholder.com/100']
            );
            userId = userResult.insertId;
            console.log('Created test user');
        } else {
            userId = existingUsers[0].id;
            console.log('Test user already exists');
        }

        const libraries = [
            { name: '刑法总论', subject: '刑法', description: '刑法基础理论与总则规定', card_count: 150 },
            { name: '民法总则', subject: '民法', description: '民法基本原则与总则规定', card_count: 120 },
            { name: '宪法学', subject: '宪法', description: '宪法基本理论与制度', card_count: 80 },
            { name: '行政法', subject: '行政法', description: '行政法基础与行政诉讼', card_count: 90 },
            { name: '刑诉法', subject: '刑事诉讼法', description: '刑事诉讼程序与制度', card_count: 110 },
            { name: '民诉法', subject: '民事诉讼法', description: '民事诉讼程序与制度', card_count: 100 }
        ];

        const libraryIds = [];
        for (const lib of libraries) {
            const [result] = await connection.query(
                'INSERT INTO libraries (name, subject, description, card_count, created_by, is_public) VALUES (?, ?, ?, ?, ?, ?)',
                [lib.name, lib.subject, lib.description, lib.card_count, userId, 1]
            );
            libraryIds.push(result.insertId);
        }
        console.log('Created libraries');

        const chapters = [
            { libraryIndex: 0, name: '刑法概述' },
            { libraryIndex: 0, name: '犯罪构成' },
            { libraryIndex: 0, name: '刑罚' },
            { libraryIndex: 1, name: '民法概述' },
            { libraryIndex: 1, name: '民事主体' },
            { libraryIndex: 1, name: '民事法律行为' },
            { libraryIndex: 1, name: '代理' },
            { libraryIndex: 2, name: '宪法基本理论' },
            { libraryIndex: 2, name: '国家机构' },
            { libraryIndex: 3, name: '行政法概述' },
            { libraryIndex: 3, name: '行政处罚' },
            { libraryIndex: 4, name: '管辖' },
            { libraryIndex: 4, name: '证据' },
            { libraryIndex: 5, name: '管辖' },
            { libraryIndex: 5, name: '当事人' }
        ];

        const chapterIds = {};
        for (const chapter of chapters) {
            const [result] = await connection.query(
                'INSERT INTO chapters (library_id, name, sort_order) VALUES (?, ?, ?)',
                [libraryIds[chapter.libraryIndex], chapter.name, 0]
            );
            const key = `${chapter.libraryIndex}_${chapter.name}`;
            chapterIds[key] = result.insertId;
        }
        console.log('Created chapters');

        const cards = [
            { libraryIndex: 0, chapterName: '刑法概述', question: '刑法的基本原则有哪些？', answer: '刑法的基本原则包括：1. 罪刑法定原则；2. 适用刑法人人平等原则；3. 罪责刑相适应原则。这三个原则是刑法适用的基本原则，贯穿于刑法的整个体系。', tags: ['基本原则', '刑法概述'], like_count: 128 },
            { libraryIndex: 0, chapterName: '刑法概述', question: '什么是罪刑法定原则？', answer: '罪刑法定原则是指法律明文规定为犯罪行为的，依照法律定罪处刑；法律没有明文规定为犯罪行为的，不得定罪处刑。其基本内容包括：法律主义、禁止事后法、禁止类推解释、禁止绝对不定期刑。', tags: ['基本原则', '罪刑法定'], like_count: 95 },
            { libraryIndex: 0, chapterName: '犯罪构成', question: '犯罪构成的四要件是什么？', answer: '犯罪构成的四要件包括：1. 犯罪客体：刑法所保护而被犯罪行为所侵害的社会关系；2. 犯罪客观方面：犯罪活动的客观外在表现；3. 犯罪主体：实施犯罪行为的人；4. 犯罪主观方面：犯罪主体对其实施的犯罪行为及其结果所持的心理态度。', tags: ['犯罪构成', '四要件'], like_count: 156 },
            { libraryIndex: 0, chapterName: '犯罪构成', question: '什么是犯罪故意？', answer: '犯罪故意是指明知自己的行为会发生危害社会的结果，并且希望或者放任这种结果发生，因而构成犯罪的，是故意犯罪。故意犯罪分为直接故意和间接故意。', tags: ['主观方面', '故意'], like_count: 87 },
            { libraryIndex: 0, chapterName: '刑罚', question: '主刑有哪些种类？', answer: '主刑包括：1. 管制；2. 拘役；3. 有期徒刑；4. 无期徒刑；5. 死刑。主刑只能独立适用，不能附加适用。', tags: ['刑罚', '主刑'], like_count: 112 },
            
            { libraryIndex: 1, chapterName: '民法概述', question: '民法的基本原则有哪些？', answer: '民法的基本原则包括：1. 平等原则；2. 自愿原则；3. 公平原则；4. 诚信原则；5. 守法与公序良俗原则；6. 绿色原则。这些原则贯穿于民法的整个体系。', tags: ['基本原则', '民法概述'], like_count: 134 },
            { libraryIndex: 1, chapterName: '民事主体', question: '自然人的民事行为能力如何分类？', answer: '自然人的民事行为能力分为三类：1. 完全民事行为能力人（18周岁以上或16周岁以上以自己劳动收入为主要生活来源）；2. 限制民事行为能力人（8周岁以上未成年人或不能完全辨认自己行为的成年人）；3. 无民事行为能力人（不满8周岁或完全不能辨认自己行为）。', tags: ['民事主体', '行为能力'], like_count: 145 },
            { libraryIndex: 1, chapterName: '民事法律行为', question: '什么是民事法律行为？', answer: '民事法律行为是民事主体通过意思表示设立、变更、终止民事法律关系的行为。其有效要件包括：1. 行为人具有相应的民事行为能力；2. 意思表示真实；3. 不违反法律、行政法规的强制性规定，不违背公序良俗。', tags: ['法律行为', '有效要件'], like_count: 98 },
            { libraryIndex: 1, chapterName: '代理', question: '代理的种类有哪些？', answer: '代理的种类包括：1. 委托代理、法定代理和指定代理；2. 一般代理和特别代理；3. 单独代理和共同代理；4. 本代理和复代理。委托代理是基于被代理人的授权而产生的代理。', tags: ['代理', '分类'], like_count: 76 },
            
            { libraryIndex: 2, chapterName: '宪法基本理论', question: '宪法的特征有哪些？', answer: '宪法的特征包括：1. 宪法是国家的根本法；2. 宪法是公民权利的保障书；3. 宪法是民主事实法律化的基本形式；4. 宪法具有最高的法律效力。', tags: ['宪法特征', '基本理论'], like_count: 89 },
            { libraryIndex: 2, chapterName: '国家机构', question: '全国人民代表大会的职权有哪些？', answer: '全国人民代表大会的职权包括：1. 修改宪法；2. 监督宪法实施；3. 制定和修改刑事、民事、国家机构的和其他的基本法律；4. 选举国家主席、副主席；5. 根据主席提名决定国务院总理人选等。', tags: ['国家机构', '人大职权'], like_count: 102 },
            
            { libraryIndex: 3, chapterName: '行政法概述', question: '行政法的基本原则有哪些？', answer: '行政法的基本原则包括：1. 行政合法性原则；2. 行政合理性原则；3. 行政应急性原则。这些原则是行政活动必须遵循的基本准则。', tags: ['基本原则', '行政法'], like_count: 67 },
            { libraryIndex: 3, chapterName: '行政处罚', question: '行政处罚的种类有哪些？', answer: '行政处罚的种类包括：1. 警告、通报批评；2. 罚款、没收违法所得、没收非法财物；3. 暂扣许可证件、降低资质等级、吊销许可证件；4. 限制开展生产经营活动、责令停产停业、责令关闭、限制从业；5. 行政拘留；6. 法律、行政法规规定的其他行政处罚。', tags: ['行政处罚', '种类'], like_count: 88 },
            
            { libraryIndex: 4, chapterName: '管辖', question: '刑事诉讼的立案管辖如何划分？', answer: '立案管辖的划分：1. 公安机关管辖：大部分刑事案件的侦查；2. 人民检察院管辖：贪污贿赂犯罪、国家工作人员渎职犯罪、国家机关工作人员利用职权实施的侵犯公民人身权利和民主权利的犯罪；3. 人民法院管辖：自诉案件。', tags: ['管辖', '立案'], like_count: 94 },
            { libraryIndex: 4, chapterName: '证据', question: '刑事诉讼证据的种类有哪些？', answer: '刑事诉讼证据的种类包括：1. 物证；2. 书证；3. 证人证言；4. 被害人陈述；5. 犯罪嫌疑人、被告人供述和辩解；6. 鉴定意见；7. 勘验、检查、辨认、侦查实验等笔录；8. 视听资料、电子数据。', tags: ['证据', '种类'], like_count: 118 },
            
            { libraryIndex: 5, chapterName: '管辖', question: '民事诉讼级别管辖如何确定？', answer: '民事诉讼级别管辖：1. 基层人民法院管辖第一审民事案件；2. 中级人民法院管辖重大涉外案件、在本辖区有重大影响的案件、最高人民法院确定由中级人民法院管辖的案件；3. 高级人民法院管辖在本辖区有重大影响的第一审民事案件；4. 最高人民法院管辖在全国有重大影响的案件。', tags: ['管辖', '级别'], like_count: 82 },
            { libraryIndex: 5, chapterName: '当事人', question: '民事诉讼当事人的权利有哪些？', answer: '民事诉讼当事人的权利包括：1. 委托代理人；2. 申请回避；3. 收集、提供证据；4. 进行辩论；5. 请求调解；6. 提起上诉；7. 申请执行；8. 申请再审等。当事人必须依法行使诉讼权利，遵守诉讼秩序。', tags: ['当事人', '诉讼权利'], like_count: 71 }
        ];

        for (const card of cards) {
            const chapterKey = `${card.libraryIndex}_${card.chapterName}`;
            const chapterId = chapterIds[chapterKey] || null;
            await connection.query(
                'INSERT INTO cards (library_id, chapter_id, question, answer, tags, created_by, is_public, like_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [libraryIds[card.libraryIndex], chapterId, card.question, card.answer, JSON.stringify(card.tags), userId, 1, card.like_count]
            );
        }
        console.log('Created cards');

        console.log('Seed data created successfully!');
    } catch (error) {
        console.error('Error seeding data:', error);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

seedData();
