require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkDatabase() {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'lawapp'
        });

        console.log('=== 数据库结构检查 ===\n');

        console.log('1. 检查必要的表是否存在...');
        const requiredTables = [
            'users',
            'libraries',
            'cards',
            'card_change_reviews',
            'library_reviews',
            'knowledge_packs'
        ];

        const [tables] = await connection.query('SHOW TABLES');
        const existingTables = tables.map(t => Object.values(t)[0]);

        for (const table of requiredTables) {
            if (existingTables.includes(table)) {
                console.log(`  ✓ ${table} 表存在`);
            } else {
                console.log(`  ✗ ${table} 表不存在`);
            }
        }

        console.log('\n2. 检查 libraries 表的字段...');
        try {
            const [columns] = await connection.query('SHOW COLUMNS FROM libraries');
            const requiredColumns = ['status', 'review_note', 'reviewed_by', 'reviewed_at'];
            const existingColumns = columns.map(c => c.Field);
            
            for (const col of requiredColumns) {
                if (existingColumns.includes(col)) {
                    console.log(`  ✓ ${col} 字段存在`);
                } else {
                    console.log(`  ✗ ${col} 字段不存在`);
                }
            }
        } catch (error) {
            console.log('  ✗ libraries 表不存在');
        }

        console.log('\n3. 检查 cards 表的字段...');
        try {
            const [columns] = await connection.query('SHOW COLUMNS FROM cards');
            const requiredColumns = ['has_pending_change'];
            const existingColumns = columns.map(c => c.Field);
            
            for (const col of requiredColumns) {
                if (existingColumns.includes(col)) {
                    console.log(`  ✓ ${col} 字段存在`);
                } else {
                    console.log(`  ✗ ${col} 字段不存在`);
                }
            }
        } catch (error) {
            console.log('  ✗ cards 表不存在');
        }

        console.log('\n4. 检查 card_change_reviews 表的字段...');
        try {
            const [columns] = await connection.query('SHOW COLUMNS FROM card_change_reviews');
            const requiredColumns = [
                'id', 'card_id', 'library_id', 'chapter_id', 'change_type',
                'old_question', 'old_answer', 'old_tags',
                'new_question', 'new_answer', 'new_tags',
                'status', 'review_note', 'reviewed_by', 'reviewed_at',
                'created_by', 'created_at'
            ];
            const existingColumns = columns.map(c => c.Field);
            
            let allExist = true;
            for (const col of requiredColumns) {
                if (existingColumns.includes(col)) {
                    console.log(`  ✓ ${col} 字段存在`);
                } else {
                    console.log(`  ✗ ${col} 字段不存在`);
                    allExist = false;
                }
            }
            
            if (allExist) {
                console.log('\n  ✓ card_change_reviews 表结构完整');
            } else {
                console.log('\n  ✗ card_change_reviews 表结构不完整');
            }
        } catch (error) {
            console.log('  ✗ card_change_reviews 表不存在');
        }

        console.log('\n5. 检查管理员用户...');
        try {
            const [users] = await connection.query('SELECT * FROM users WHERE openid = ?', ['admin_account']);
            if (users.length > 0) {
                const admin = users[0];
                console.log(`  ✓ 管理员用户存在 (ID: ${admin.id}, 角色: ${admin.role})`);
                if (admin.role !== 'admin') {
                    console.log('  ⚠ 管理员用户角色不是 admin，需要更新');
                }
            } else {
                console.log('  ✗ 管理员用户不存在');
            }
        } catch (error) {
            console.log('  ✗ 检查管理员用户失败:', error.message);
        }

        console.log('\n6. 测试查询...');
        try {
            const [result] = await connection.query(`
                SELECT COUNT(*) as count FROM card_change_reviews WHERE status = 'pending'
            `);
            console.log(`  ✓ 查询成功，待审核数量: ${result[0].count}`);
        } catch (error) {
            console.log('  ✗ 查询失败:', error.message);
        }

        console.log('\n=== 检查完成 ===');

    } catch (error) {
        console.error('数据库连接失败:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

checkDatabase();
