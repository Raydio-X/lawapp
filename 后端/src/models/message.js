const db = require('../config/database');

class MessageModel {
    static async create({ user_id, title, content, type = 'system', sender_id = null }) {
        const [result] = await db.execute(
            'INSERT INTO messages (user_id, title, content, type, sender_id) VALUES (?, ?, ?, ?, ?)',
            [user_id, title, content, type, sender_id]
        );

        const [rows] = await db.execute(
            'SELECT * FROM messages WHERE id = ?',
            [result.insertId]
        );

        return rows[0];
    }

    static async getList(userId, params = {}) {
        const { page = 1, pageSize = 20, type } = params;
        const offset = (page - 1) * pageSize;

        let sql = 'SELECT * FROM messages WHERE user_id = ?';
        const values = [userId];

        if (type) {
            sql += ' AND type = ?';
            values.push(type);
        }

        let countSql = 'SELECT COUNT(*) as total FROM messages WHERE user_id = ?';
        const countValues = [userId];

        if (type) {
            countSql += ' AND type = ?';
            countValues.push(type);
        }

        const [countRows] = await db.execute(countSql, countValues);

        const limitNum = parseInt(pageSize);
        const offsetNum = parseInt(offset);
        sql += ` ORDER BY created_at DESC LIMIT ${limitNum} OFFSET ${offsetNum}`;

        const [rows] = await db.execute(sql, values);

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

    static async getUnreadCount(userId) {
        const [rows] = await db.execute(
            'SELECT COUNT(*) as count FROM messages WHERE user_id = ? AND is_read = 0',
            [userId]
        );
        return rows[0].count;
    }

    static async markAsRead(id, userId) {
        const [result] = await db.execute(
            'UPDATE messages SET is_read = 1 WHERE id = ? AND user_id = ?',
            [id, userId]
        );
        return result.affectedRows > 0;
    }

    static async markAllAsRead(userId) {
        const [result] = await db.execute(
            'UPDATE messages SET is_read = 1 WHERE user_id = ? AND is_read = 0',
            [userId]
        );
        return result.affectedRows;
    }

    static async delete(id, userId) {
        const [result] = await db.execute(
            'DELETE FROM messages WHERE id = ? AND user_id = ?',
            [id, userId]
        );
        return result.affectedRows > 0;
    }

    static async broadcast({ title, content, type = 'announcement', sender_id = null }) {
        const [users] = await db.execute('SELECT id FROM users');

        if (users.length === 0) return { count: 0 };

        const values = users.map(u => [u.id, title, content, type, sender_id]);
        const placeholders = values.map(() => '(?, ?, ?, ?, ?)').join(', ');
        const flatValues = values.flat();

        await db.execute(
            `INSERT INTO messages (user_id, title, content, type, sender_id) VALUES ${placeholders}`,
            flatValues
        );

        return { count: users.length };
    }
}

module.exports = MessageModel;
