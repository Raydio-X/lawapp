const db = require('./src/config/database');

async function migrate() {
    try {
        console.log('开始迁移：修改 cards 表结构...');
        
        const [columns] = await db.execute(
            "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'cards' AND COLUMN_NAME = 'is_hot'"
        );
        
        if (columns.length === 0) {
            await db.execute(`
                ALTER TABLE cards 
                ADD COLUMN is_hot TINYINT DEFAULT 0 AFTER is_public,
                ADD INDEX idx_is_hot (is_hot)
            `);
            console.log('成功添加 is_hot 字段');
        } else {
            console.log('is_hot 字段已存在，跳过');
        }

        const [foreignKeys] = await db.execute(`
            SELECT CONSTRAINT_NAME 
            FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
            WHERE TABLE_NAME = 'cards' 
            AND COLUMN_NAME = 'library_id' 
            AND REFERENCED_TABLE_NAME IS NOT NULL
        `);
        
        for (const fk of foreignKeys) {
            try {
                await db.execute(`ALTER TABLE cards DROP FOREIGN KEY ${fk.CONSTRAINT_NAME}`);
                console.log(`删除外键 ${fk.CONSTRAINT_NAME}`);
            } catch (e) {
                console.log(`外键 ${fk.CONSTRAINT_NAME} 不存在或已删除`);
            }
        }

        const [colInfo] = await db.execute(`
            SELECT IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'cards' AND COLUMN_NAME = 'library_id'
        `);
        
        if (colInfo.length > 0 && colInfo[0].IS_NULLABLE === 'NO') {
            await db.execute(`ALTER TABLE cards MODIFY library_id INT NULL`);
            console.log('成功修改 library_id 为可空');
        } else {
            console.log('library_id 已是可空字段');
        }

        try {
            await db.execute(`
                ALTER TABLE cards 
                ADD CONSTRAINT fk_cards_library 
                FOREIGN KEY (library_id) REFERENCES libraries(id) ON DELETE SET NULL
            `);
            console.log('成功添加新外键约束');
        } catch (e) {
            console.log('外键约束已存在或添加失败:', e.message);
        }
        
        console.log('迁移完成');
        process.exit(0);
    } catch (error) {
        console.error('迁移失败:', error);
        process.exit(1);
    }
}

migrate();
