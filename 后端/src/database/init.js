require('dotenv').config();
const mysql = require('mysql2/promise');

async function initDatabase() {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || ''
        });

        console.log('Connected to MySQL server');

        await connection.query('DROP DATABASE IF EXISTS lawapp');
        console.log('Dropped existing database');

        await connection.query('CREATE DATABASE lawapp DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
        console.log('Created database');

        await connection.query('USE lawapp');
        console.log('Using database lawapp');

        await connection.query(`
            CREATE TABLE users (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id VARCHAR(20) UNIQUE,
                openid VARCHAR(100) UNIQUE,
                nickname VARCHAR(50) NOT NULL DEFAULT '微信用户',
                avatar VARCHAR(500) DEFAULT '',
                bio VARCHAR(200) DEFAULT '',
                phone VARCHAR(20) DEFAULT '',
                gender TINYINT DEFAULT 0,
                role VARCHAR(20) DEFAULT 'user' COMMENT '用户角色: admin, user',
                daily_goal INT DEFAULT 50,
                is_vip TINYINT DEFAULT 0,
                vip_expires_at TIMESTAMP NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_openid (openid),
                INDEX idx_user_id (user_id),
                INDEX idx_is_vip (is_vip),
                INDEX idx_role (role)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('Created users table');

        await connection.query(`
            CREATE TABLE categories (
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(50) NOT NULL,
                description VARCHAR(200) DEFAULT '',
                sort_order INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('Created categories table');

        await connection.query(`
            CREATE TABLE libraries (
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(100) NOT NULL,
                subject VARCHAR(50) NOT NULL,
                description TEXT,
                cover_image VARCHAR(500) DEFAULT '',
                created_by INT NOT NULL,
                is_public TINYINT DEFAULT 1,
                status VARCHAR(20) DEFAULT 'approved' COMMENT '审核状态: pending-待审核, approved-审核通过, rejected-审核驳回',
                review_note TEXT COMMENT '审核意见/驳回原因',
                reviewed_by INT NULL COMMENT '审核人ID',
                reviewed_at DATETIME NULL COMMENT '审核时间',
                view_count INT DEFAULT 0,
                like_count INT DEFAULT 0,
                favorite_count INT DEFAULT 0,
                card_count INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_subject (subject),
                INDEX idx_created_by (created_by),
                INDEX idx_status (status),
                FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('Created libraries table');

        await connection.query(`
            CREATE TABLE chapters (
                id INT PRIMARY KEY AUTO_INCREMENT,
                library_id INT NOT NULL,
                name VARCHAR(100) NOT NULL,
                sort_order INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_library_id (library_id),
                FOREIGN KEY (library_id) REFERENCES libraries(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('Created chapters table');

        await connection.query(`
            CREATE TABLE cards (
                id INT PRIMARY KEY AUTO_INCREMENT,
                library_id INT,
                chapter_id INT,
                question TEXT NOT NULL,
                answer TEXT NOT NULL,
                tags JSON,
                created_by INT NOT NULL,
                view_count INT DEFAULT 0,
                like_count INT DEFAULT 0,
                study_count INT DEFAULT 0,
                is_public TINYINT DEFAULT 1,
                is_hot TINYINT DEFAULT 0,
                has_pending_change TINYINT DEFAULT 0 COMMENT '是否有待审核的变更',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_library_id (library_id),
                INDEX idx_chapter_id (chapter_id),
                INDEX idx_created_by (created_by),
                INDEX idx_is_hot (is_hot),
                INDEX idx_has_pending_change (has_pending_change),
                FOREIGN KEY (library_id) REFERENCES libraries(id) ON DELETE SET NULL,
                FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE SET NULL,
                FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('Created cards table');

        await connection.query(`
            CREATE TABLE study_records (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL,
                card_id INT NOT NULL,
                library_id INT NOT NULL,
                feedback ENUM('easy', 'normal', 'difficult') DEFAULT 'normal',
                study_duration INT DEFAULT 0,
                is_formal_study TINYINT(1) DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_user_id (user_id),
                INDEX idx_card_id (card_id),
                INDEX idx_library_id (library_id),
                INDEX idx_created_at (created_at),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE,
                FOREIGN KEY (library_id) REFERENCES libraries(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('Created study_records table');

        await connection.query(`
            CREATE TABLE card_mastery (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL,
                card_id INT NOT NULL,
                library_id INT NOT NULL,
                mastered TINYINT(1) DEFAULT 0,
                review_count INT DEFAULT 0,
                next_review_date DATE,
                last_review_date DATE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY uk_user_card (user_id, card_id),
                INDEX idx_user_id (user_id),
                INDEX idx_card_id (card_id),
                INDEX idx_library_id (library_id),
                INDEX idx_next_review (next_review_date),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE,
                FOREIGN KEY (library_id) REFERENCES libraries(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('Created card_mastery table');

        await connection.query(`
            CREATE TABLE comments (
                id INT PRIMARY KEY AUTO_INCREMENT,
                card_id INT NOT NULL,
                user_id INT NOT NULL,
                content TEXT NOT NULL,
                like_count INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_card_id (card_id),
                INDEX idx_user_id (user_id),
                FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('Created comments table');

        await connection.query(`
            CREATE TABLE favorites (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL,
                target_type ENUM('library', 'card') NOT NULL,
                target_id INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY uk_user_target (user_id, target_type, target_id),
                INDEX idx_user_id (user_id),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('Created favorites table');

        await connection.query(`
            CREATE TABLE user_likes (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL,
                target_type ENUM('library', 'card') NOT NULL,
                target_id INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY uk_user_target (user_id, target_type, target_id),
                INDEX idx_user_id (user_id),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('Created user_likes table');

        await connection.query(`
            CREATE TABLE wrong_cards (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL,
                card_id INT NOT NULL,
                is_mastered TINYINT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY uk_user_card (user_id, card_id),
                INDEX idx_user_id (user_id),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('Created wrong_cards table');

        await connection.query(`
            CREATE TABLE user_stats (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL UNIQUE,
                total_study_days INT DEFAULT 0,
                total_study_time INT DEFAULT 0,
                total_cards_learned INT DEFAULT 0,
                current_streak INT DEFAULT 0,
                longest_streak INT DEFAULT 0,
                last_study_date DATE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('Created user_stats table');

        await connection.query(`
            CREATE TABLE study_time_records (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL,
                library_id INT NULL,
                duration INT NOT NULL DEFAULT 0 COMMENT '学习时长(秒)',
                study_date DATE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_user_date (user_id, study_date),
                INDEX idx_study_date (study_date)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('Created study_time_records table');

        await connection.query(`
            CREATE TABLE study_progress (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL UNIQUE,
                library_ids JSON,
                library_names TEXT,
                card_list JSON,
                current_index INT DEFAULT 0,
                learned INT DEFAULT 0,
                total INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('Created study_progress table');

        await connection.query(`
            CREATE TABLE messages (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL,
                title VARCHAR(200) NOT NULL DEFAULT '',
                content TEXT NOT NULL,
                type ENUM('system', 'violation', 'announcement') DEFAULT 'system',
                is_read TINYINT(1) DEFAULT 0,
                sender_id INT DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_user_id (user_id),
                INDEX idx_type (type),
                INDEX idx_is_read (is_read),
                INDEX idx_created_at (created_at),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('Created messages table');

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

        await connection.query(`
            CREATE TABLE activation_codes (
                id INT PRIMARY KEY AUTO_INCREMENT,
                code VARCHAR(10) UNIQUE NOT NULL,
                duration_days INT NOT NULL,
                is_used TINYINT DEFAULT 0,
                used_by INT NULL,
                used_at TIMESTAMP NULL,
                created_by INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_code (code),
                INDEX idx_is_used (is_used),
                FOREIGN KEY (used_by) REFERENCES users(id) ON DELETE SET NULL,
                FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('Created activation_codes table');

        await connection.query(`
            CREATE TABLE feedback (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL,
                content TEXT NOT NULL,
                contact VARCHAR(100) DEFAULT '',
                status TINYINT DEFAULT 0,
                reply TEXT,
                replied_at TIMESTAMP NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_user_id (user_id),
                INDEX idx_status (status),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('Created feedback table');

        await connection.query(`
            CREATE TABLE card_links (
                id INT PRIMARY KEY AUTO_INCREMENT,
                card_id INT NOT NULL,
                linked_card_id INT NOT NULL,
                user_id INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_link (card_id, linked_card_id, user_id),
                INDEX idx_card_id (card_id),
                INDEX idx_linked_card_id (linked_card_id),
                INDEX idx_user_id (user_id),
                FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE,
                FOREIGN KEY (linked_card_id) REFERENCES cards(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('Created card_links table');

        await connection.query(`
            CREATE TABLE card_change_reviews (
                id INT PRIMARY KEY AUTO_INCREMENT,
                card_id INT NULL COMMENT '卡片ID，新建时为NULL',
                library_id INT NOT NULL COMMENT '知识库ID',
                chapter_id INT NULL COMMENT '章节ID',
                change_type VARCHAR(20) NOT NULL COMMENT '变更类型: create-新建, update-修改',
                old_question TEXT NULL COMMENT '原问题内容',
                old_answer TEXT NULL COMMENT '原答案内容',
                old_tags JSON NULL COMMENT '原标签',
                new_question TEXT NOT NULL COMMENT '新问题内容',
                new_answer TEXT NOT NULL COMMENT '新答案内容',
                new_tags JSON NULL COMMENT '新标签',
                status VARCHAR(20) DEFAULT 'pending' COMMENT '审核状态: pending-待审核, approved-审核通过, rejected-审核驳回',
                review_note TEXT NULL COMMENT '审核意见/驳回原因',
                reviewed_by INT NULL COMMENT '审核人ID',
                reviewed_at DATETIME NULL COMMENT '审核时间',
                created_by INT NOT NULL COMMENT '提交人ID',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_card_id (card_id),
                INDEX idx_library_id (library_id),
                INDEX idx_status (status),
                INDEX idx_created_by (created_by),
                INDEX idx_created_at (created_at),
                FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE SET NULL,
                FOREIGN KEY (library_id) REFERENCES libraries(id) ON DELETE CASCADE,
                FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
                FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('Created card_change_reviews table');

        await connection.query(`
            CREATE TABLE library_reviews (
                id INT PRIMARY KEY AUTO_INCREMENT,
                library_id INT NOT NULL COMMENT '知识库ID',
                reviewer_id INT NOT NULL COMMENT '审核人ID',
                action VARCHAR(20) NOT NULL COMMENT '审核动作: approve-通过, reject-驳回',
                note TEXT COMMENT '审核意见',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_library_id (library_id),
                INDEX idx_reviewer_id (reviewer_id),
                INDEX idx_created_at (created_at),
                FOREIGN KEY (library_id) REFERENCES libraries(id) ON DELETE CASCADE,
                FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('Created library_reviews table');

        await connection.query(`
            CREATE TABLE knowledge_packs (
                id INT PRIMARY KEY AUTO_INCREMENT,
                title VARCHAR(255) NOT NULL COMMENT '知识包标题',
                description TEXT COMMENT '知识包简介',
                file_path VARCHAR(500) NOT NULL COMMENT 'PDF文件存储路径',
                file_name VARCHAR(255) NOT NULL COMMENT '原始文件名',
                file_size BIGINT NOT NULL COMMENT '文件大小(字节)',
                file_type VARCHAR(50) DEFAULT 'application/pdf' COMMENT '文件MIME类型',
                cover_image VARCHAR(500) COMMENT '封面图片路径',
                category VARCHAR(100) COMMENT '分类',
                tags JSON COMMENT '标签',
                download_count INT DEFAULT 0 COMMENT '下载次数',
                view_count INT DEFAULT 0 COMMENT '查看次数',
                is_public TINYINT DEFAULT 1 COMMENT '是否公开 0-私有 1-公开',
                is_featured TINYINT DEFAULT 0 COMMENT '是否精选 0-否 1-是',
                created_by INT COMMENT '创建者ID',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_category (category),
                INDEX idx_is_public (is_public),
                INDEX idx_is_featured (is_featured),
                INDEX idx_created_at (created_at),
                INDEX idx_download_count (download_count),
                FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('Created knowledge_packs table');

        await connection.query(
            `INSERT INTO users (user_id, openid, nickname, avatar, bio, role) VALUES (?, ?, ?, ?, ?, ?)`,
            ['LK000000', 'admin_account', '管理员', '', '系统管理员', 'admin']
        );
        console.log('Created default admin user');

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
            { word: '有病', category: 'insult' },
            { word: '弱智', category: 'insult' },
            { word: '傻X', category: 'profanity' },
            { word: 'tmd', category: 'profanity' },
            { word: 'SB', category: 'profanity' },
            { word: 'fw', category: 'insult' },
            { word: 'NC', category: 'insult' }
        ];

        for (const bw of blockedWords) {
            await connection.query(
                'INSERT INTO blocked_words (word, category) VALUES (?, ?)',
                [bw.word, bw.category]
            );
        }
        console.log('Inserted default blocked words');

        console.log('Database and tables created successfully!');
    } catch (error) {
        console.error('Error initializing database:', error);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

initDatabase();
