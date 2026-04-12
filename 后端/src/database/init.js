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
                openid VARCHAR(100) UNIQUE,
                nickname VARCHAR(50) NOT NULL DEFAULT '微信用户',
                avatar VARCHAR(500) DEFAULT '',
                bio VARCHAR(200) DEFAULT '',
                phone VARCHAR(20) DEFAULT '',
                gender TINYINT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_openid (openid)
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
                view_count INT DEFAULT 0,
                like_count INT DEFAULT 0,
                favorite_count INT DEFAULT 0,
                card_count INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_subject (subject),
                INDEX idx_created_by (created_by),
                FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
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
                library_id INT NOT NULL,
                chapter_id INT,
                question TEXT NOT NULL,
                answer TEXT NOT NULL,
                tags JSON,
                created_by INT NOT NULL,
                view_count INT DEFAULT 0,
                like_count INT DEFAULT 0,
                study_count INT DEFAULT 0,
                is_public TINYINT DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_library_id (library_id),
                INDEX idx_chapter_id (chapter_id),
                INDEX idx_created_by (created_by),
                FOREIGN KEY (library_id) REFERENCES libraries(id) ON DELETE CASCADE,
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
