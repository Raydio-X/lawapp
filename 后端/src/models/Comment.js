const db = require('../config/database');

class CommentModel {
    static async getList(cardId, params = {}, userId = null) {
        const { page = 1, pageSize = 10 } = params;
        const offset = (page - 1) * pageSize;

        let sql = `SELECT cm.*, u.nickname, u.avatar`;
        if (userId) {
            sql += `, (SELECT COUNT(*) FROM comment_likes WHERE comment_id = cm.id AND user_id = ${userId}) as is_liked`;
        } else {
            sql += `, 0 as is_liked`;
        }
        sql += ` FROM comments cm
             LEFT JOIN users u ON cm.user_id = u.id
             WHERE cm.card_id = ?
             ORDER BY cm.like_count DESC, cm.created_at DESC
             LIMIT ${parseInt(pageSize)} OFFSET ${offset}`;

        const [rows] = await db.execute(sql, [cardId]);

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
            `SELECT cm.*, u.nickname, u.avatar, 0 as is_liked
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

    static async like(commentId, userId) {
        const [existing] = await db.execute(
            'SELECT id FROM comment_likes WHERE comment_id = ? AND user_id = ?',
            [commentId, userId]
        );

        if (existing.length > 0) {
            return { success: false, message: '已经点赞过了' };
        }

        await db.execute(
            'INSERT INTO comment_likes (comment_id, user_id) VALUES (?, ?)',
            [commentId, userId]
        );

        await db.execute(
            'UPDATE comments SET like_count = like_count + 1 WHERE id = ?',
            [commentId]
        );

        return { success: true, message: '点赞成功' };
    }

    static async unlike(commentId, userId) {
        const [existing] = await db.execute(
            'SELECT id FROM comment_likes WHERE comment_id = ? AND user_id = ?',
            [commentId, userId]
        );

        if (existing.length === 0) {
            return { success: false, message: '尚未点赞' };
        }

        await db.execute(
            'DELETE FROM comment_likes WHERE comment_id = ? AND user_id = ?',
            [commentId, userId]
        );

        await db.execute(
            'UPDATE comments SET like_count = GREATEST(0, like_count - 1) WHERE id = ?',
            [commentId]
        );

        return { success: true, message: '取消点赞成功' };
    }

    static async toggleLike(commentId, userId) {
        const [existing] = await db.execute(
            'SELECT id FROM comment_likes WHERE comment_id = ? AND user_id = ?',
            [commentId, userId]
        );

        if (existing.length > 0) {
            await db.execute(
                'DELETE FROM comment_likes WHERE comment_id = ? AND user_id = ?',
                [commentId, userId]
            );

            await db.execute(
                'UPDATE comments SET like_count = GREATEST(0, like_count - 1) WHERE id = ?',
                [commentId]
            );

            return { success: true, liked: false, message: '取消点赞成功' };
        } else {
            await db.execute(
                'INSERT INTO comment_likes (comment_id, user_id) VALUES (?, ?)',
                [commentId, userId]
            );

            await db.execute(
                'UPDATE comments SET like_count = like_count + 1 WHERE id = ?',
                [commentId]
            );

            return { success: true, liked: true, message: '点赞成功' };
        }
    }

    static async isLiked(commentId, userId) {
        const [rows] = await db.execute(
            'SELECT id FROM comment_likes WHERE comment_id = ? AND user_id = ?',
            [commentId, userId]
        );
        return rows.length > 0;
    }
}

module.exports = CommentModel;
