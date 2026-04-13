const db = require('../config/database');

class ChapterModel {
    static async getList(libraryId) {
        const [rows] = await db.execute(
            `SELECT ch.*, 
             (SELECT COUNT(*) FROM cards c WHERE c.chapter_id = ch.id) as card_count
             FROM chapters ch 
             WHERE ch.library_id = ? 
             ORDER BY ch.sort_order ASC, ch.id ASC`,
            [libraryId]
        );
        return rows;
    }

    static async getTree(libraryId) {
        const rows = await this.getList(libraryId);
        
        const map = {};
        const roots = [];
        
        rows.forEach(item => {
            map[item.id] = { ...item, children: [] };
        });
        
        rows.forEach(item => {
            if (item.parent_id && map[item.parent_id]) {
                map[item.parent_id].children.push(map[item.id]);
            } else {
                roots.push(map[item.id]);
            }
        });
        
        return roots;
    }

    static async findById(id) {
        const [rows] = await db.execute(
            `SELECT ch.*, l.name as library_name,
             (SELECT COUNT(*) FROM cards c WHERE c.chapter_id = ch.id) as card_count
             FROM chapters ch 
             LEFT JOIN libraries l ON ch.library_id = l.id 
             WHERE ch.id = ?`,
            [id]
        );
        return rows[0];
    }

    static async create(data) {
        const [result] = await db.execute(
            'INSERT INTO chapters (library_id, name, sort_order, parent_id, level) VALUES (?, ?, ?, ?, ?)',
            [data.library_id, data.name, data.sort_order || 0, data.parent_id || null, data.level || 1]
        );
        return this.findById(result.insertId);
    }

    static async batchCreate(libraryId, chapters) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();
            
            const idMap = {};
            
            for (const chapter of chapters) {
                const parentId = chapter.parentId ? idMap[chapter.parentId] : null;
                const [result] = await connection.execute(
                    'INSERT INTO chapters (library_id, name, sort_order, parent_id, level) VALUES (?, ?, ?, ?, ?)',
                    [libraryId, chapter.name, chapter.sort_order || 0, parentId, chapter.level || 1]
                );
                idMap[chapter.id] = result.insertId;
            }
            
            await connection.commit();
            return { success: true };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    static async batchUpdate(libraryId, chapters) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();
            
            const [existingRows] = await connection.execute(
                'SELECT id FROM chapters WHERE library_id = ?',
                [libraryId]
            );
            const existingIds = existingRows.map(row => row.id);
            const chapterIds = chapters.filter(c => c.id > 0).map(c => c.id);
            
            const idsToDelete = existingIds.filter(id => !chapterIds.includes(id));
            for (const id of idsToDelete) {
                await connection.execute('DELETE FROM chapters WHERE id = ?', [id]);
            }
            
            const idMap = {};
            
            for (const chapter of chapters) {
                if (chapter.id > 0 && existingIds.includes(chapter.id)) {
                    const parentId = chapter.parentId ? (idMap[chapter.parentId] || chapter.parentId) : null;
                    await connection.execute(
                        'UPDATE chapters SET name = ?, sort_order = ?, parent_id = ?, level = ? WHERE id = ?',
                        [chapter.name, chapter.sort_order || 0, parentId, chapter.level || 1, chapter.id]
                    );
                    idMap[chapter.id] = chapter.id;
                } else {
                    const parentId = chapter.parentId ? (idMap[chapter.parentId] || null) : null;
                    const [result] = await connection.execute(
                        'INSERT INTO chapters (library_id, name, sort_order, parent_id, level) VALUES (?, ?, ?, ?, ?)',
                        [libraryId, chapter.name, chapter.sort_order || 0, parentId, chapter.level || 1]
                    );
                    idMap[chapter.id] = result.insertId;
                }
            }
            
            await connection.commit();
            return { success: true };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    static async update(id, data) {
        const fields = [];
        const values = [];

        if (data.name !== undefined) {
            fields.push('name = ?');
            values.push(data.name);
        }
        if (data.sort_order !== undefined) {
            fields.push('sort_order = ?');
            values.push(data.sort_order);
        }
        if (data.parent_id !== undefined) {
            fields.push('parent_id = ?');
            values.push(data.parent_id);
        }
        if (data.level !== undefined) {
            fields.push('level = ?');
            values.push(data.level);
        }

        if (fields.length === 0) return this.findById(id);

        values.push(id);
        await db.execute(
            `UPDATE chapters SET ${fields.join(', ')} WHERE id = ?`,
            values
        );
        return this.findById(id);
    }

    static async delete(id) {
        await db.execute('DELETE FROM chapters WHERE id = ?', [id]);
    }

    static async getCards(id) {
        const [rows] = await db.execute(
            `SELECT * FROM cards WHERE chapter_id = ? ORDER BY id ASC`,
            [id]
        );
        return rows.map(row => ({
            ...row,
            tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : (row.tags || [])
        }));
    }
}

module.exports = ChapterModel;
