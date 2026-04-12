const http = require('http');

const BASE_URL = 'http://localhost:3000/api';

let testResults = [];
let token = '';
let testUserId = 1;

function request(method, path, data = null, headers = {}) {
    return new Promise((resolve, reject) => {
        const url = new URL(BASE_URL + path);
        
        const options = {
            hostname: url.hostname,
            port: url.port || 3000,
            path: url.pathname + url.search,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    resolve({
                        status: res.statusCode,
                        data: JSON.parse(body)
                    });
                } catch (e) {
                    resolve({
                        status: res.statusCode,
                        data: body
                    });
                }
            });
        });

        req.on('error', reject);
        req.setTimeout(5000, () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });

        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

function logTest(name, passed, message = '') {
    const result = { name, passed, message };
    testResults.push(result);
    const status = passed ? '✅' : '❌';
    console.log(`${status} ${name}${message ? ': ' + message : ''}`);
}

async function runTests() {
    console.log('\n========================================');
    console.log('  法硕背诵小程序 API 测试');
    console.log('========================================\n');

    console.log('--- 基础测试 ---');
    
    try {
        const health = await request('GET', '/health');
        logTest('健康检查', health.status === 200 && health.data.success);
    } catch (e) {
        logTest('健康检查', false, '服务器未启动');
        console.log('\n请先启动服务器: npm run dev');
        return;
    }

    console.log('\n--- 认证接口测试 ---');

    try {
        const loginRes = await request('POST', '/auth/login', {
            code: 'test_code_123',
            userInfo: { nickName: '测试用户', avatarUrl: '' }
        });
        
        if (loginRes.status === 200 && loginRes.data.success) {
            token = loginRes.data.data.token;
            testUserId = loginRes.data.data.userInfo.id;
            logTest('用户登录', true, `Token: ${token.substring(0, 20)}...`);
        } else {
            logTest('用户登录', false, loginRes.data.message);
        }
    } catch (e) {
        logTest('用户登录', false, e.message);
    }

    try {
        const meRes = await request('GET', '/auth/me', null, {
            'Authorization': `Bearer ${token}`
        });
        logTest('获取用户信息', meRes.status === 200 && meRes.data.success);
    } catch (e) {
        logTest('获取用户信息', false, e.message);
    }

    console.log('\n--- 知识库接口测试 ---');

    try {
        const listRes = await request('GET', '/libraries?page=1&pageSize=10');
        logTest('获取知识库列表', listRes.status === 200 && listRes.data.success,
            `共 ${listRes.data.data.pagination?.total || 0} 条`);
    } catch (e) {
        logTest('获取知识库列表', false, e.message);
    }

    try {
        const recommendedRes = await request('GET', '/libraries/recommended?limit=5');
        logTest('获取推荐知识库', recommendedRes.status === 200 && recommendedRes.data.success);
    } catch (e) {
        logTest('获取推荐知识库', false, e.message);
    }

    try {
        const categoriesRes = await request('GET', '/libraries/categories');
        logTest('获取分类列表', categoriesRes.status === 200 && categoriesRes.data.success);
    } catch (e) {
        logTest('获取分类列表', false, e.message);
    }

    try {
        const myRes = await request('GET', '/libraries/my', null, {
            'Authorization': `Bearer ${token}`
        });
        logTest('获取我的知识库', myRes.status === 200 && myRes.data.success);
    } catch (e) {
        logTest('获取我的知识库', false, e.message);
    }

    try {
        const detailRes = await request('GET', '/libraries/1');
        logTest('获取知识库详情', detailRes.status === 200 && detailRes.data.success);
    } catch (e) {
        logTest('获取知识库详情', false, e.message);
    }

    console.log('\n--- 卡片接口测试 ---');

    try {
        const cardsRes = await request('GET', '/cards?page=1&pageSize=10');
        logTest('获取卡片列表', cardsRes.status === 200 && cardsRes.data.success,
            `共 ${cardsRes.data.data.pagination?.total || 0} 条`);
    } catch (e) {
        logTest('获取卡片列表', false, e.message);
    }

    try {
        const hotRes = await request('GET', '/cards/hot?limit=5');
        logTest('获取热门卡片', hotRes.status === 200 && hotRes.data.success);
    } catch (e) {
        logTest('获取热门卡片', false, e.message);
    }

    try {
        const searchRes = await request('GET', '/cards/search?keyword=%E5%88%91%E6%B3%95');
        logTest('搜索卡片', searchRes.status === 200 && searchRes.data.success);
    } catch (e) {
        logTest('搜索卡片', false, e.message);
    }

    try {
        const cardDetailRes = await request('GET', '/cards/1');
        logTest('获取卡片详情', cardDetailRes.status === 200 && cardDetailRes.data.success);
    } catch (e) {
        logTest('获取卡片详情', false, e.message);
    }

    console.log('\n--- 学习记录接口测试 ---');

    try {
        const statsRes = await request('GET', '/study/stats', null, {
            'Authorization': `Bearer ${token}`
        });
        logTest('获取学习统计', statsRes.status === 200 && statsRes.data.success);
    } catch (e) {
        logTest('获取学习统计', false, e.message);
    }

    try {
        const todayRes = await request('GET', '/study/today', null, {
            'Authorization': `Bearer ${token}`
        });
        logTest('获取今日学习', todayRes.status === 200 && todayRes.data.success);
    } catch (e) {
        logTest('获取今日学习', false, e.message);
    }

    console.log('\n--- 评论接口测试 ---');

    try {
        const commentsRes = await request('GET', '/cards/1/comments');
        logTest('获取评论列表', commentsRes.status === 200 && commentsRes.data.success);
    } catch (e) {
        logTest('获取评论列表', false, e.message);
    }

    console.log('\n--- 收藏接口测试 ---');

    try {
        const favRes = await request('GET', '/favorites', null, {
            'Authorization': `Bearer ${token}`
        });
        logTest('获取收藏列表', favRes.status === 200 && favRes.data.success);
    } catch (e) {
        logTest('获取收藏列表', false, e.message);
    }

    console.log('\n--- 错题本接口测试 ---');

    try {
        const wrongRes = await request('GET', '/wrong-cards', null, {
            'Authorization': `Bearer ${token}`
        });
        logTest('获取错题列表', wrongRes.status === 200 && wrongRes.data.success);
    } catch (e) {
        logTest('获取错题列表', false, e.message);
    }

    console.log('\n--- 写入操作测试 ---');

    try {
        const createLibRes = await request('POST', '/libraries', {
            name: '测试知识库',
            subject: '测试学科',
            description: '这是一个测试知识库'
        }, {
            'Authorization': `Bearer ${token}`
        });
        logTest('创建知识库', createLibRes.status === 201 && createLibRes.data.success);
    } catch (e) {
        logTest('创建知识库', false, e.message);
    }

    try {
        const createCardRes = await request('POST', '/cards', {
            library_id: 1,
            question: '测试问题',
            answer: '测试答案',
            tags: ['测试']
        }, {
            'Authorization': `Bearer ${token}`
        });
        logTest('创建卡片', createCardRes.status === 201 && createCardRes.data.success);
    } catch (e) {
        logTest('创建卡片', false, e.message);
    }

    try {
        const studyRes = await request('POST', '/cards/1/study', {
            feedback: 'easy',
            duration: 30
        }, {
            'Authorization': `Bearer ${token}`
        });
        logTest('记录学习', studyRes.status === 200 && studyRes.data.success);
    } catch (e) {
        logTest('记录学习', false, e.message);
    }

    try {
        const commentRes = await request('POST', '/cards/1/comments', {
            content: '这是一条测试评论'
        }, {
            'Authorization': `Bearer ${token}`
        });
        logTest('发表评论', commentRes.status === 201 && commentRes.data.success);
    } catch (e) {
        logTest('发表评论', false, e.message);
    }

    console.log('\n========================================');
    console.log('  测试结果汇总');
    console.log('========================================');
    
    const passed = testResults.filter(r => r.passed).length;
    const failed = testResults.filter(r => !r.passed).length;
    const total = testResults.length;
    
    console.log(`\n总计: ${total} 个测试`);
    console.log(`✅ 通过: ${passed}`);
    console.log(`❌ 失败: ${failed}`);
    console.log(`通过率: ${((passed / total) * 100).toFixed(1)}%`);
    
    if (failed > 0) {
        console.log('\n失败的测试:');
        testResults.filter(r => !r.passed).forEach(r => {
            console.log(`  - ${r.name}: ${r.message}`);
        });
    }
}

runTests().catch(console.error);
