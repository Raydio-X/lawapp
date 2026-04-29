const db = require('../config/database');

class BlockedWordModel {
    static async getList(params = {}) {
        const { page = 1, pageSize = 50, keyword = '' } = params;
        const offset = (page - 1) * pageSize;

        let sql = 'SELECT * FROM blocked_words WHERE 1=1';
        const queryParams = [];

        if (keyword) {
            sql += ' AND word LIKE ?';
            queryParams.push(`%${keyword}%`);
        }

        sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        queryParams.push(parseInt(pageSize), offset);

        const [rows] = await db.execute(sql, queryParams);

        let countSql = 'SELECT COUNT(*) as total FROM blocked_words WHERE 1=1';
        const countParams = [];
        if (keyword) {
            countSql += ' AND word LIKE ?';
            countParams.push(`%${keyword}%`);
        }
        const [countRows] = await db.execute(countSql, countParams);

        return {
            list: rows,
            pagination: {
                page: parseInt(page),
                pageSize: parseInt(pageSize),
                total: countRows[0].total,
                totalPages: Math.ceil(countRows[0].total / pageSize)
            }
        };
    }

    static async getAll() {
        const [rows] = await db.execute(
            'SELECT word FROM blocked_words WHERE is_enabled = 1'
        );
        return rows.map(row => row.word);
    }

    static async create(word, category = 'general', createdBy = null) {
        const [result] = await db.execute(
            'INSERT INTO blocked_words (word, category, created_by) VALUES (?, ?, ?)',
            [word, category, createdBy]
        );

        const [rows] = await db.execute(
            'SELECT * FROM blocked_words WHERE id = ?',
            [result.insertId]
        );

        return rows[0];
    }

    static async update(id, data) {
        const fields = [];
        const values = [];

        if (data.word !== undefined) {
            fields.push('word = ?');
            values.push(data.word);
        }
        if (data.category !== undefined) {
            fields.push('category = ?');
            values.push(data.category);
        }
        if (data.is_enabled !== undefined) {
            fields.push('is_enabled = ?');
            values.push(data.is_enabled);
        }

        if (fields.length === 0) {
            return null;
        }

        values.push(id);
        await db.execute(
            `UPDATE blocked_words SET ${fields.join(', ')} WHERE id = ?`,
            values
        );

        const [rows] = await db.execute(
            'SELECT * FROM blocked_words WHERE id = ?',
            [id]
        );

        return rows[0];
    }

    static async delete(id) {
        const [result] = await db.execute(
            'DELETE FROM blocked_words WHERE id = ?',
            [id]
        );
        return result.affectedRows > 0;
    }

    static async batchCreate(words, category = 'general', createdBy = null) {
        const values = words.map(word => [word, category, createdBy]);
        const placeholders = values.map(() => '(?, ?, ?)').join(', ');
        const flatValues = values.flat();

        await db.execute(
            `INSERT IGNORE INTO blocked_words (word, category, created_by) VALUES ${placeholders}`,
            flatValues
        );

        return { count: words.length };
    }
}

module.exports = BlockedWordModel;
