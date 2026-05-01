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
        console.log('开始执行难度字段迁移...');
        
        const statements = [
            'ALTER TABLE cards ADD COLUMN difficulty_rating DECIMAL(3,2) DEFAULT 0',
            'ALTER TABLE cards ADD COLUMN difficulty_count INT DEFAULT 0'
        ];
        
        for (const statement of statements) {
            try {
                await connection.execute(statement);
                console.log('✓ 执行成功: ' + statement);
            } catch (error) {
                if (error.code === 'ER_DUP_FIELDNAME') {
                    console.log('✓ 字段已存在，跳过: ' + statement);
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
