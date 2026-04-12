const db = require('../config/database');

class WrongCardModel {
    static async getList(userId, params = {}) {
        const { page = 1, pageSize = 10 } = params;
        const offset = (page - 1) * pageSize;

        const [rows] = await db.execute(
            `SELECT wc.*, c.question, c.answer, c.tags, l.name as library_name
             FROM wrong_cards wc
             LEFT JOIN cards c ON wc.card_id = c.id
             LEFT JOIN libraries l ON c.library_id = l.id
             WHERE wc.user_id = ?
             ORDER BY wc.created_at DESC
             LIMIT ${parseInt(pageSize)} OFFSET ${offset}`,
            [userId]
        );

        const [countRows] = await db.execute(
            'SELECT COUNT(*) as total FROM wrong_cards WHERE user_id = ?',
            [userId]
        );

        return {
            list: rows.map(row => ({
                ...row,
                tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : (row.tags || [])
            })),
            pagination: {
                page: parseInt(page),
                pageSize: parseInt(pageSize),
                total: countRows[0].total,
                totalPages: Math.ceil(countRows[0].total / pageSize)
            }
        };
    }

    static async getStats(userId) {
        const [total] = await db.execute(
            'SELECT COUNT(*) as count FROM wrong_cards WHERE user_id = ?',
            [userId]
        );

        const [mastered] = await db.execute(
            'SELECT COUNT(*) as count FROM wrong_cards WHERE user_id = ? AND is_mastered = 1',
            [userId]
        );

        return {
            total: total[0].count,
            mastered: mastered[0].count,
            unmastered: total[0].count - mastered[0].count
        };
    }

    static async add(userId, cardId) {
        try {
            const [result] = await db.execute(
                'INSERT INTO wrong_cards (user_id, card_id) VALUES (?, ?)',
                [userId, cardId]
            );
            return { success: true, id: result.insertId };
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                return { success: false, message: 'Already in wrong cards' };
            }
            throw error;
        }
    }

    static async markAsMastered(userId, cardId) {
        await db.execute(
            'UPDATE wrong_cards SET is_mastered = 1 WHERE user_id = ? AND card_id = ?',
            [userId, cardId]
        );
    }

    static async markAsUnmastered(userId, cardId) {
        await db.execute(
            'UPDATE wrong_cards SET is_mastered = 0 WHERE user_id = ? AND card_id = ?',
            [userId, cardId]
        );
    }

    static async delete(userId, cardId) {
        const [result] = await db.execute(
            'DELETE FROM wrong_cards WHERE user_id = ? AND card_id = ?',
            [userId, cardId]
        );
        return result.affectedRows > 0;
    }
}

module.exports = WrongCardModel;
