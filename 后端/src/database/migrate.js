require('dotenv').config();
const mysql = require('mysql2/promise');

async function migrate() {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: 'lawapp'
        });

        console.log('Connected to database');

        const [tables] = await connection.query(
            "SHOW TABLES LIKE 'comment_likes'"
        );

        if (tables.length === 0) {
            await connection.query(`
                CREATE TABLE comment_likes (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    comment_id INT NOT NULL,
                    user_id INT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE KEY uk_comment_user (comment_id, user_id),
                    INDEX idx_comment_id (comment_id),
                    INDEX idx_user_id (user_id),
                    FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            `);
            console.log('Created comment_likes table');
        } else {
            console.log('comment_likes table already exists');
        }

        const [blockedTables] = await connection.query(
            "SHOW TABLES LIKE 'blocked_words'"
        );

        if (blockedTables.length === 0) {
            await connection.query(`
                CREATE TABLE blocked_words (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    word VARCHAR(100) NOT NULL UNIQUE,
                    category VARCHAR(50) DEFAULT 'general',
                    is_enabled TINYINT(1) DEFAULT 1,
                    created_by INT DEFAULT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX idx_word (word),
                    INDEX idx_category (category),
                    INDEX idx_is_enabled (is_enabled)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            `);
            console.log('Created blocked_words table');

            const blockedWords = [
                { word: '傻逼', category: 'profanity' },
                { word: '操你', category: 'profanity' },
                { word: '妈的', category: 'profanity' },
                { word: '他妈的', category: 'profanity' },
                { word: '草泥马', category: 'profanity' },
                { word: '王八蛋', category: 'profanity' },
                { word: '滚蛋', category: 'profanity' },
                { word: '混蛋', category: 'profanity' },
                { word: '贱人', category: 'profanity' },
                { word: '婊子', category: 'profanity' },
                { word: '垃圾', category: 'insult' },
                { word: '废物', category: 'insult' },
                { word: '智障', category: 'insult' },
                { word: '脑残', category: 'insult' },
                { word: '白痴', category: 'insult' },
                { word: '弱智', category: 'insult' },
                { word: '傻X', category: 'profanity' },
                { word: 'SB', category: 'profanity' },
                { word: 'sb', category: 'profanity' },
                { word: 'NC', category: 'insult' },
                { word: 'nc', category: 'insult' }
            ];

            for (const bw of blockedWords) {
                await connection.query(
                    'INSERT IGNORE INTO blocked_words (word, category) VALUES (?, ?)',
                    [bw.word, bw.category]
                );
            }
            console.log('Inserted default blocked words');
        } else {
            console.log('blocked_words table already exists');
        }

        console.log('Migration completed successfully!');
    } catch (error) {
        console.error('Migration error:', error);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

migrate();
