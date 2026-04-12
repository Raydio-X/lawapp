const db = require('../config/database');

class CommentModel {
    static async getList(cardId, params = {}) {
        const { page = 1, pageSize = 10 } = params;
        const offset = (page - 1) * pageSize;

        const [rows] = await db.execute(
            `SELECT cm.*, u.nickname, u.avatar
             FROM comments cm
             LEFT JOIN users u ON cm.user_id = u.id
             WHERE cm.card_id = ?
             ORDER BY cm.created_at DESC
             LIMIT ${parseInt(pageSize)} OFFSET ${offset}`,
            [cardId]
        );

        const [countRows] = await db.execute(
            'SELECT COUNT(*) as total FROM comments WHERE card_id = ?',
            [cardId]
        );

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

    static async create(cardId, userId, content) {
        const [result] = await db.execute(
            'INSERT INTO comments (card_id, user_id, content) VALUES (?, ?, ?)',
            [cardId, userId, content]
        );

        const [rows] = await db.execute(
            `SELECT cm.*, u.nickname, u.avatar
             FROM comments cm
             LEFT JOIN users u ON cm.user_id = u.id
             WHERE cm.id = ?`,
            [result.insertId]
        );

        return rows[0];
    }

    static async delete(id, userId) {
        const [result] = await db.execute(
            'DELETE FROM comments WHERE id = ? AND user_id = ?',
            [id, userId]
        );
        return result.affectedRows > 0;
    }

    static async like(id) {
        await db.execute(
            'UPDATE comments SET like_count = like_count + 1 WHERE id = ?',
            [id]
        );
    }
}

module.exports = CommentModel;
