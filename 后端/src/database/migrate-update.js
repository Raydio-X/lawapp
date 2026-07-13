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

        console.log('\n=== 清理测试数据 ===');
        
        try {
            const [testUser] = await connection.query('SELECT id FROM users WHERE openid = ?', ['test_openid']);
            if (testUser.length > 0) {
                const testUserId = testUser[0].id;
                console.log('发现测试用户，正在清理测试数据...');
                
                await connection.query('DELETE FROM card_change_reviews WHERE created_by = ?', [testUserId]);
                await connection.query('DELETE FROM cards WHERE created_by = ?', [testUserId]);
                await connection.query('DELETE FROM chapters WHERE library_id IN (SELECT id FROM libraries WHERE created_by = ?)', [testUserId]);
                await connection.query('DELETE FROM libraries WHERE created_by = ?', [testUserId]);
                await connection.query('DELETE FROM users WHERE id = ?', [testUserId]);
                
                console.log('✓ 测试数据已清理');
            } else {
                console.log('✓ 无测试数据需要清理');
            }
        } catch (error) {
            console.error('清理测试数据失败:', error.message);
        }

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

        console.log('\n=== 检查并添加 user_stats 表的字段 ===');
        
        try {
            const [columns] = await connection.query('SHOW COLUMNS FROM user_stats LIKE "batch_import_count"');
            if (columns.length === 0) {
                console.log('添加 batch_import_count 字段...');
                await connection.query('ALTER TABLE user_stats ADD COLUMN batch_import_count INT DEFAULT 0 COMMENT \'当日批量导入次数\'');
                console.log('✓ batch_import_count 字段已添加');
            } else {
                console.log('✓ batch_import_count 字段已存在');
            }
        } catch (error) {
            console.error('添加 batch_import_count 字段失败:', error.message);
        }

        try {
            const [columns] = await connection.query('SHOW COLUMNS FROM user_stats LIKE "batch_import_date"');
            if (columns.length === 0) {
                console.log('添加 batch_import_date 字段...');
                await connection.query('ALTER TABLE user_stats ADD COLUMN batch_import_date DATE COMMENT \'最后批量导入日期\'');
                console.log('✓ batch_import_date 字段已添加');
            } else {
                console.log('✓ batch_import_date 字段已存在');
            }
        } catch (error) {
            console.error('添加 batch_import_date 字段失败:', error.message);
        }

        console.log('\n=== 检查并创建 study_hour_records 表 ===');
        
        try {
            const [tables] = await connection.query('SHOW TABLES LIKE "study_hour_records"');
            if (tables.length === 0) {
                console.log('创建 study_hour_records 表...');
                await connection.query(`
                    CREATE TABLE study_hour_records (
                        id INT PRIMARY KEY AUTO_INCREMENT,
                        user_id INT NOT NULL,
                        library_id INT NULL,
                        duration INT NOT NULL DEFAULT 0 COMMENT '学习时长(秒)',
                        study_date DATE NOT NULL,
                        hour TINYINT NOT NULL COMMENT '小时(0-23)',
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        INDEX idx_user_date_hour (user_id, study_date, hour),
                        INDEX idx_study_date (study_date),
                        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                        FOREIGN KEY (library_id) REFERENCES libraries(id) ON DELETE SET NULL
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                `);
                console.log('✓ study_hour_records 表已创建');
            } else {
                console.log('✓ study_hour_records 表已存在');
            }
        } catch (error) {
            console.error('创建 study_hour_records 表失败:', error.message);
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

        console.log('\n=== 检查并添加 users 表的 UnionID 字段 ===');
        
        try {
            const [columns] = await connection.query('SHOW COLUMNS FROM users LIKE "unionid"');
            if (columns.length === 0) {
                console.log('添加 unionid 字段...');
                await connection.query(`
                    ALTER TABLE users 
                    ADD COLUMN unionid VARCHAR(100) DEFAULT NULL COMMENT 'QQ UnionID，用于跨平台识别同一用户'
                `);
                console.log('✓ unionid 字段已添加');
            } else {
                console.log('✓ unionid 字段已存在');
            }
        } catch (error) {
            console.error('添加 unionid 字段失败:', error.message);
        }

        // 添加 unionid 索引
        try {
            const [indexes] = await connection.query('SHOW INDEX FROM users WHERE Key_name = "idx_unionid"');
            if (indexes.length === 0) {
                console.log('添加 idx_unionid 索引...');
                await connection.query('CREATE INDEX idx_unionid ON users(unionid)');
                console.log('✓ idx_unionid 索引已添加');
            } else {
                console.log('✓ idx_unionid 索引已存在');
            }
        } catch (error) {
            console.error('添加 idx_unionid 索引失败:', error.message);
        }

        // 添加 unionid 唯一约束
        try {
            const [indexes] = await connection.query('SHOW INDEX FROM users WHERE Key_name = "uk_unionid"');
            if (indexes.length === 0) {
                console.log('添加 uk_unionid 唯一约束...');
                await connection.query('ALTER TABLE users ADD UNIQUE INDEX uk_unionid (unionid)');
                console.log('✓ uk_unionid 唯一约束已添加');
            } else {
                console.log('✓ uk_unionid 唯一约束已存在');
            }
        } catch (error) {
            console.error('添加 uk_unionid 唯一约束失败:', error.message);
        }

        // 添加 nickname_updated_at 字段（如果不存在）
        try {
            const [columns] = await connection.query('SHOW COLUMNS FROM users LIKE "nickname_updated_at"');
            if (columns.length === 0) {
                console.log('添加 nickname_updated_at 字段...');
                await connection.query(`
                    ALTER TABLE users 
                    ADD COLUMN nickname_updated_at TIMESTAMP NULL COMMENT '昵称最后更新时间'
                `);
                console.log('✓ nickname_updated_at 字段已添加');
            } else {
                console.log('✓ nickname_updated_at 字段已存在');
            }
        } catch (error) {
            console.error('添加 nickname_updated_at 字段失败:', error.message);
        }

        console.log('\n=== 检查现有QQ登录用户的UnionID迁移状态 ===');
        
        try {
            const [qqUsers] = await connection.query(
                'SELECT id, user_id, openid, nickname, unionid FROM users WHERE openid LIKE "qq_%"'
            );
            
            console.log(`找到 ${qqUsers.length} 个QQ登录用户`);
            
            let migratedCount = 0;
            let pendingCount = 0;
            
            for (const user of qqUsers) {
                if (user.openid.startsWith('qq_union_')) {
                    migratedCount++;
                } else {
                    pendingCount++;
                }
            }
            
            console.log(`已迁移到UnionID: ${migratedCount} 个用户`);
            console.log(`待迁移(使用OpenID): ${pendingCount} 个用户`);
            
            if (pendingCount > 0) {
                console.log('\n说明：');
                console.log('- 待迁移的用户将在下次登录时自动迁移到UnionID');
                console.log('- 无需手动干预，系统会自动处理');
                console.log('- 建议通知用户重新登录以完成迁移');
            }
        } catch (error) {
            console.error('检查QQ用户迁移状态失败:', error.message);
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

        console.log('\n=== 创建应用版本管理表 ===');
        
        try {
            const [tables] = await connection.query("SHOW TABLES LIKE 'app_versions'");
            if (tables.length === 0) {
                console.log('创建 app_versions 表...');
                await connection.query(`
                    CREATE TABLE app_versions (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        version_code INT NOT NULL COMMENT '版本号（数字）',
                        version_name VARCHAR(20) NOT NULL COMMENT '版本名（如 1.0.0）',
                        platform VARCHAR(20) DEFAULT 'android' COMMENT '平台：android, ios',
                        download_url VARCHAR(500) NOT NULL COMMENT '下载地址',
                        force_update TINYINT(1) DEFAULT 0 COMMENT '是否强制更新',
                        force_update_versions JSON COMMENT '强制更新的版本列表',
                        update_log TEXT COMMENT '更新日志',
                        is_active TINYINT(1) DEFAULT 1 COMMENT '是否启用',
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        INDEX idx_platform (platform),
                        INDEX idx_version_code (version_code),
                        INDEX idx_is_active (is_active)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='应用版本管理表'
                `);
                console.log('✓ app_versions 表创建成功');
                
                // 插入初始版本记录
                await connection.query(`
                    INSERT INTO app_versions (version_code, version_name, platform, download_url, force_update, update_log)
                    VALUES (1, '1.0.0', 'android', 'https://www.lawapp.top/download/lawapp-1.0.0.apk', 0, '初始版本')
                `);
                console.log('✓ 初始版本记录已创建');
            } else {
                console.log('✓ app_versions 表已存在');
            }
        } catch (error) {
            console.error('创建版本管理表失败:', error.message);
        }

        console.log('\n=== 创建知识包文件夹表 ===');
        
        try {
            const [tables] = await connection.query('SHOW TABLES LIKE "knowledge_pack_folders"');
            if (tables.length === 0) {
                console.log('创建 knowledge_pack_folders 表...');
                await connection.query(`
                    CREATE TABLE knowledge_pack_folders (
                        id INT PRIMARY KEY AUTO_INCREMENT,
                        name VARCHAR(100) NOT NULL COMMENT '文件夹名称',
                        description VARCHAR(500) DEFAULT NULL COMMENT '文件夹描述',
                        sort_order INT DEFAULT 0 COMMENT '排序顺序',
                        created_by INT NOT NULL COMMENT '创建者ID',
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        INDEX idx_sort_order (sort_order),
                        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='知识包文件夹'
                `);
                console.log('✓ knowledge_pack_folders 表已创建');
            } else {
                console.log('✓ knowledge_pack_folders 表已存在');
                
                // 如果存在 parent_id 字段，删除它（不支持嵌套）
                try {
                    const [columns] = await connection.query('SHOW COLUMNS FROM knowledge_pack_folders LIKE "parent_id"');
                    if (columns.length > 0) {
                        console.log('删除 parent_id 字段（不支持嵌套文件夹）...');
                        await connection.query('ALTER TABLE knowledge_pack_folders DROP FOREIGN KEY IF EXISTS knowledge_pack_folders_ibfk_1');
                        await connection.query('ALTER TABLE knowledge_pack_folders DROP INDEX IF EXISTS idx_parent_id');
                        await connection.query('ALTER TABLE knowledge_pack_folders DROP COLUMN parent_id');
                        console.log('✓ parent_id 字段已删除');
                    }
                } catch (e) {
                    console.log('删除 parent_id 字段失败，跳过:', e.message);
                }
            }
        } catch (error) {
            console.error('创建知识包文件夹表失败:', error.message);
        }

        console.log('\n=== 给 knowledge_packs 表添加 folder_id 字段 ===');
        
        try {
            const [columns] = await connection.query('SHOW COLUMNS FROM knowledge_packs LIKE "folder_id"');
            if (columns.length === 0) {
                console.log('添加 folder_id 字段...');
                await connection.query('ALTER TABLE knowledge_packs ADD COLUMN folder_id INT DEFAULT NULL COMMENT \'所属文件夹ID\'');
                try {
                    await connection.query('CREATE INDEX idx_folder_id ON knowledge_packs(folder_id)');
                } catch (e) {
                    console.log('索引已存在，跳过');
                }
                try {
                    await connection.query('ALTER TABLE knowledge_packs ADD CONSTRAINT fk_folder_id FOREIGN KEY (folder_id) REFERENCES knowledge_pack_folders(id) ON DELETE SET NULL');
                } catch (e) {
                    console.log('外键约束添加失败，跳过:', e.message);
                }
                console.log('✓ folder_id 字段已添加');
            } else {
                console.log('✓ folder_id 字段已存在');
            }
        } catch (error) {
            console.error('添加 folder_id 字段失败:', error.message);
        }

        console.log('\n=== 更新 messages 表 type 字段 ===');
        
        try {
            // 检查当前 ENUM 值是否包含 'vip_expire'
            const [columns] = await connection.query('SHOW COLUMNS FROM messages LIKE "type"');
            if (columns.length > 0) {
                const currentType = columns[0].Type;
                if (!currentType.includes('vip_expire')) {
                    console.log('添加 vip_expire 到 type ENUM...');
                    await connection.query("ALTER TABLE messages MODIFY COLUMN type ENUM('system', 'violation', 'announcement', 'vip_expire') DEFAULT 'system'");
                    console.log('✓ type 字段已更新，添加了 vip_expire');
                } else {
                    console.log('✓ type 字段已包含 vip_expire');
                }
            }
        } catch (error) {
            console.error('更新 messages 表 type 字段失败:', error.message);
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
