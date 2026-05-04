require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });
const db = require('../../config/database');
const UserIdGenerator = require('../../utils/userIdGenerator');

async function migrate() {
    let connection;
    try {
        connection = await db.getConnection();
        
        const [columns] = await connection.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'users' 
            AND COLUMN_NAME = 'user_id'
        `);

        if (columns.length === 0) {
            console.log('添加 user_id 字段...');
            await connection.query(`
                ALTER TABLE users 
                ADD COLUMN user_id VARCHAR(20) UNIQUE AFTER id
            `);
            await connection.query(`
                CREATE INDEX idx_user_id ON users(user_id)
            `);
            console.log('user_id 字段添加成功');
        }

        const [users] = await connection.query(`
            SELECT id FROM users WHERE user_id IS NULL OR user_id = ''
        `);

        console.log(`发现 ${users.length} 个需要生成 user_id 的用户`);

        for (const user of users) {
            const userId = await UserIdGenerator.generateUniqueId();
            await connection.query(`
                UPDATE users SET user_id = ? WHERE id = ?
            `, [userId, user.id]);
            console.log(`用户 ${user.id} 生成 user_id: ${userId}`);
        }

        console.log('迁移完成！');
    } catch (error) {
        console.error('迁移失败:', error);
        throw error;
    } finally {
        if (connection) {
            connection.release();
        }
        process.exit(0);
    }
}

migrate();
