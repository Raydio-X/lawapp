require('dotenv').config();
const mysql = require('mysql2/promise');

async function migrateDatabase() {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'lawapp'
        });

        console.log('Connected to MySQL database');

        console.log('\n=== 检查并添加 libraries 表的审核字段 ===');
        
        try {
            const [columns] = await connection.query('SHOW COLUMNS FROM libraries LIKE "status"');
            if (columns.length === 0) {
                console.log('添加 status 字段...');
                await connection.query(`
                    ALTER TABLE libraries 
                    ADD COLUMN status VARCHAR(20) DEFAULT 'approved' COMMENT '审核状态: pending-待审核, approved-审核通过, rejected-审核驳回'
                `);
                try {
                    await connection.query('CREATE INDEX idx_library_status ON libraries(status)');
                } catch (e) {
                    console.log('索引已存在，跳过');
                }
                console.log('✓ status 字段已添加');
            } else {
                console.log('✓ status 字段已存在');
            }
        } catch (error) {
            console.error('添加 status 字段失败:', error.message);
        }

        try {
            const [columns] = await connection.query('SHOW COLUMNS FROM libraries LIKE "review_note"');
            if (columns.length === 0) {
                console.log('添加 review_note 字段...');
                await connection.query('ALTER TABLE libraries ADD COLUMN review_note TEXT COMMENT \'审核意见/驳回原因\'');
                console.log('✓ review_note 字段已添加');
            } else {
                console.log('✓ review_note 字段已存在');
            }
        } catch (error) {
            console.error('添加 review_note 字段失败:', error.message);
        }

        try {
            const [columns] = await connection.query('SHOW COLUMNS FROM libraries LIKE "reviewed_by"');
            if (columns.length === 0) {
                console.log('添加 reviewed_by 字段...');
                await connection.query('ALTER TABLE libraries ADD COLUMN reviewed_by INT NULL COMMENT \'审核人ID\'');
                try {
                    await connection.query('ALTER TABLE libraries ADD CONSTRAINT fk_reviewed_by FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL');
                } catch (e) {
                    console.log('外键约束已存在或添加失败，跳过:', e.message);
                }
                console.log('✓ reviewed_by 字段已添加');
            } else {
                console.log('✓ reviewed_by 字段已存在');
            }
        } catch (error) {
            console.error('添加 reviewed_by 字段失败:', error.message);
        }

        try {
            const [columns] = await connection.query('SHOW COLUMNS FROM libraries LIKE "reviewed_at"');
            if (columns.length === 0) {
                console.log('添加 reviewed_at 字段...');
                await connection.query('ALTER TABLE libraries ADD COLUMN reviewed_at DATETIME NULL COMMENT \'审核时间\'');
                console.log('✓ reviewed_at 字段已添加');
            } else {
                console.log('✓ reviewed_at 字段已存在');
            }
        } catch (error) {
            console.error('添加 reviewed_at 字段失败:', error.message);
        }

        console.log('\n=== 检查并添加 cards 表的审核字段 ===');
        
        try {
            const [columns] = await connection.query('SHOW COLUMNS FROM cards LIKE "has_pending_change"');
            if (columns.length === 0) {
                console.log('添加 has_pending_change 字段...');
                await connection.query('ALTER TABLE cards ADD COLUMN has_pending_change TINYINT DEFAULT 0 COMMENT \'是否有待审核的变更\'');
                try {
                    await connection.query('CREATE INDEX idx_has_pending_change ON cards(has_pending_change)');
                } catch (e) {
                    console.log('索引已存在，跳过');
                }
                console.log('✓ has_pending_change 字段已添加');
            } else {
                console.log('✓ has_pending_change 字段已存在');
            }
        } catch (error) {
            console.error('添加 has_pending_change 字段失败:', error.message);
        }

        try {
            const [columns] = await connection.query('SHOW COLUMNS FROM cards LIKE "keywords"');
            if (columns.length === 0) {
                console.log('添加 keywords 字段...');
                await connection.query('ALTER TABLE cards ADD COLUMN keywords JSON COMMENT \'关键词\'');
                console.log('✓ keywords 字段已添加');
            } else {
                console.log('✓ keywords 字段已存在');
            }
        } catch (error) {
            console.error('添加 keywords 字段失败:', error.message);
        }

        try {
            const [columns] = await connection.query('SHOW COLUMNS FROM cards LIKE "difficulty_rating"');
            if (columns.length === 0) {
                console.log('添加 difficulty_rating 字段...');
                await connection.query('ALTER TABLE cards ADD COLUMN difficulty_rating DECIMAL(3,2) DEFAULT 0 COMMENT \'难度评分(1-5)\'');
                console.log('✓ difficulty_rating 字段已添加');
            } else {
                console.log('✓ difficulty_rating 字段已存在');
            }
        } catch (error) {
            console.error('添加 difficulty_rating 字段失败:', error.message);
        }

        try {
            const [columns] = await connection.query('SHOW COLUMNS FROM cards LIKE "difficulty_count"');
            if (columns.length === 0) {
                console.log('添加 difficulty_count 字段...');
                await connection.query('ALTER TABLE cards ADD COLUMN difficulty_count INT DEFAULT 0 COMMENT \'难度评分人数\'');
                console.log('✓ difficulty_count 字段已添加');
            } else {
                console.log('✓ difficulty_count 字段已存在');
            }
        } catch (error) {
            console.error('添加 difficulty_count 字段失败:', error.message);
        }

        console.log('\n=== 检查并添加 chapters 表的字段 ===');
        
        try {
            const [columns] = await connection.query('SHOW COLUMNS FROM chapters LIKE "parent_id"');
            if (columns.length === 0) {
                console.log('添加 parent_id 字段...');
                await connection.query('ALTER TABLE chapters ADD COLUMN parent_id INT NULL COMMENT \'父章节ID\'');
                try {
                    await connection.query('CREATE INDEX idx_parent_id ON chapters(parent_id)');
                } catch (e) {
                    console.log('索引已存在，跳过');
                }
                try {
                    await connection.query('ALTER TABLE chapters ADD CONSTRAINT fk_chapter_parent FOREIGN KEY (parent_id) REFERENCES chapters(id) ON DELETE SET NULL');
                } catch (e) {
                    console.log('外键约束添加失败，跳过:', e.message);
                }
                console.log('✓ parent_id 字段已添加');
            } else {
                console.log('✓ parent_id 字段已存在');
            }
        } catch (error) {
            console.error('添加 parent_id 字段失败:', error.message);
        }

        try {
            const [columns] = await connection.query('SHOW COLUMNS FROM chapters LIKE "level"');
            if (columns.length === 0) {
                console.log('添加 level 字段...');
                await connection.query('ALTER TABLE chapters ADD COLUMN level INT DEFAULT 1 COMMENT \'章节层级\'');
                console.log('✓ level 字段已添加');
            } else {
                console.log('✓ level 字段已存在');
            }
        } catch (error) {
            console.error('添加 level 字段失败:', error.message);
        }

        console.log('\n=== 检查并创建 card_change_reviews 表 ===');
        
        try {
            const [tables] = await connection.query('SHOW TABLES LIKE "card_change_reviews"');
            if (tables.length === 0) {
                console.log('创建 card_change_reviews 表...');
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
                console.log('✓ card_change_reviews 表已创建');
            } else {
                console.log('✓ card_change_reviews 表已存在');
                
                const [columns] = await connection.query('SHOW COLUMNS FROM card_change_reviews');
                const columnNames = columns.map(c => c.Field);
                
                if (!columnNames.includes('review_note')) {
                    console.log('添加 review_note 字段到 card_change_reviews...');
                    await connection.query('ALTER TABLE card_change_reviews ADD COLUMN review_note TEXT NULL COMMENT \'审核意见/驳回原因\'');
                    console.log('✓ review_note 字段已添加');
                }
            }
        } catch (error) {
            console.error('创建 card_change_reviews 表失败:', error.message);
        }

        console.log('\n=== 检查并创建 library_reviews 表 ===');
        
        try {
            const [tables] = await connection.query('SHOW TABLES LIKE "library_reviews"');
            if (tables.length === 0) {
                console.log('创建 library_reviews 表...');
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
                console.log('✓ library_reviews 表已创建');
            } else {
                console.log('✓ library_reviews 表已存在');
            }
        } catch (error) {
            console.error('创建 library_reviews 表失败:', error.message);
        }

        console.log('\n=== 检查并创建 knowledge_packs 表 ===');
        
        try {
            const [tables] = await connection.query('SHOW TABLES LIKE "knowledge_packs"');
            if (tables.length === 0) {
                console.log('创建 knowledge_packs 表...');
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
                console.log('✓ knowledge_packs 表已创建');
            } else {
                console.log('✓ knowledge_packs 表已存在');
            }
        } catch (error) {
            console.error('创建 knowledge_packs 表失败:', error.message);
        }

        console.log('\n=== 更新现有知识库的审核状态 ===');
        
        try {
            const [result] = await connection.query(`
                UPDATE libraries 
                SET status = 'approved', reviewed_at = created_at 
                WHERE status IS NULL OR status = 'pending'
            `);
            console.log(`✓ 已更新 ${result.affectedRows} 条知识库记录的审核状态`);
        } catch (error) {
            console.error('更新知识库审核状态失败:', error.message);
        }

        console.log('\n=== 检查管理员用户 ===');
        
        try {
            const [users] = await connection.query('SELECT * FROM users WHERE openid = ?', ['admin_account']);
            if (users.length === 0) {
                console.log('创建默认管理员用户...');
                await connection.query(
                    'INSERT INTO users (user_id, openid, nickname, avatar, bio, role) VALUES (?, ?, ?, ?, ?, ?)',
                    ['LK000000', 'admin_account', '管理员', '', '系统管理员', 'admin']
                );
                console.log('✓ 默认管理员用户已创建');
            } else {
                const admin = users[0];
                if (admin.role !== 'admin') {
                    console.log('更新管理员用户角色...');
                    await connection.query('UPDATE users SET role = ? WHERE id = ?', ['admin', admin.id]);
                    console.log('✓ 管理员用户角色已更新');
                } else {
                    console.log('✓ 管理员用户已存在且角色正确');
                }
            }
        } catch (error) {
            console.error('检查管理员用户失败:', error.message);
        }

        console.log('\n=== 验证数据库结构 ===');
        
        try {
            const [tables] = await connection.query('SHOW TABLES');
            console.log('\n当前数据库中的表:');
            tables.forEach(t => {
                const tableName = Object.values(t)[0];
                console.log(`  - ${tableName}`);
            });
        } catch (error) {
            console.error('验证数据库结构失败:', error.message);
        }

        console.log('\n=== 迁移完成 ===');
        console.log('数据库结构已更新，所有必要的表和字段都已创建。');

    } catch (error) {
        console.error('迁移失败:', error);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

migrateDatabase();
