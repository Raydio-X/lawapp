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
            'INSERT INTO chapters (library_id, name, sort_order) VALUES (?, ?, ?)',
            [data.library_id, data.name, data.sort_order || 0]
        );
        return this.findById(result.insertId);
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
