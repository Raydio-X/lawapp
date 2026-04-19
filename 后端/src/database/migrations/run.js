require('dotenv').config();
const mysql = require('mysql2/promise');

async function runMigration() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'lawapp',
        multipleStatements: true
    });

    try {
        console.log('开始执行数据库迁移...');
        
        const statements = [
            'ALTER TABLE card_mastery ADD COLUMN review_count INT DEFAULT 0',
            'ALTER TABLE card_mastery ADD COLUMN next_review_date DATE',
            'ALTER TABLE card_mastery ADD COLUMN last_review_date DATE',
            'CREATE INDEX idx_next_review ON card_mastery(next_review_date)',
            `UPDATE card_mastery 
             SET review_count = 1, next_review_date = CURDATE(), last_review_date = CURDATE()
             WHERE mastered = 1 AND next_review_date IS NULL`,
            'ALTER TABLE users ADD COLUMN daily_goal INT DEFAULT 50',
            'UPDATE users SET daily_goal = 50 WHERE daily_goal IS NULL'
        ];
        
        for (const statement of statements) {
            try {
                await connection.execute(statement);
                console.log('✓ 执行成功: ' + statement.substring(0, 50) + '...');
            } catch (error) {
                if (error.code === 'ER_DUP_FIELDNAME') {
                    console.log('✓ 字段已存在，跳过');
                } else if (error.code === 'ER_DUP_KEYNAME') {
                    console.log('✓ 索引已存在，跳过');
                } else {
                    console.error('执行失败:', error.message);
                }
            }
        }
        
        console.log('\n数据库迁移完成！');
        
    } catch (error) {
        console.error('迁移失败:', error.message);
        process.exit(1);
    } finally {
        await connection.end();
    }
}

runMigration();
