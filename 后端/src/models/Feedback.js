const db = require('../config/database');

class FeedbackModel {
    static async create(userId, content, contact = null) {
        const [result] = await db.execute(
            'INSERT INTO feedback (user_id, content, contact, status, created_at) VALUES (?, ?, ?, 0, NOW())',
            [userId, content, contact]
        );
        return result.insertId;
    }

    static async getList(params = {}) {
        const { page = 1, pageSize = 20, status } = params;
        const offset = (page - 1) * pageSize;

        let sql = `SELECT f.*, u.nickname 
                   FROM feedback f 
                   LEFT JOIN users u ON f.user_id = u.id 
                   WHERE 1=1`;
        const values = [];

        if (status !== undefined && status !== null && status !== '') {
            sql += ' AND f.status = ?';
            values.push(parseInt(status));
        }

        sql += ` ORDER BY f.created_at DESC LIMIT ${parseInt(pageSize)} OFFSET ${parseInt(offset)}`;

        const [rows] = await db.execute(sql, values);

        let countSql = 'SELECT COUNT(*) as total FROM feedback WHERE 1=1';
        const countValues = [];
        if (status !== undefined && status !== null && status !== '') {
            countSql += ' AND status = ?';
            countValues.push(parseInt(status));
        }

        const [countRows] = await db.execute(countSql, countValues);

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

    static async updateStatus(id, status, reply = null) {
        if (reply) {
            const [result] = await db.execute(
                'UPDATE feedback SET status = ?, reply = ?, replied_at = NOW() WHERE id = ?',
                [status, reply, id]
            );
            return result.affectedRows > 0;
        } else {
            const [result] = await db.execute(
                'UPDATE feedback SET status = ? WHERE id = ?',
                [status, id]
            );
            return result.affectedRows > 0;
        }
    }

    static async getById(id) {
        const [rows] = await db.execute(
            `SELECT f.*, u.nickname 
             FROM feedback f 
             LEFT JOIN users u ON f.user_id = u.id 
             WHERE f.id = ?`,
            [id]
        );
        return rows[0] || null;
    }

    static async getUserFeedbacks(userId, page = 1, pageSize = 20) {
        const offset = (page - 1) * pageSize;

        const [rows] = await db.execute(
            `SELECT * FROM feedback WHERE user_id = ? ORDER BY created_at DESC LIMIT ${parseInt(pageSize)} OFFSET ${parseInt(offset)}`,
            [userId]
        );

        const [countRows] = await db.execute(
            'SELECT COUNT(*) as total FROM feedback WHERE user_id = ?',
            [userId]
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
}

module.exports = FeedbackModel;
