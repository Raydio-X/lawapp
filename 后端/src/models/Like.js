const db = require('../config/database');

class LikeModel {
    static async add(userId, targetType, targetId) {
        try {
            const [result] = await db.execute(
                'INSERT INTO user_likes (user_id, target_type, target_id) VALUES (?, ?, ?)',
                [userId, targetType, targetId]
            );
            return { success: true, id: result.insertId };
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                return { success: false, message: 'Already liked' };
            }
            throw error;
        }
    }

    static async remove(userId, targetType, targetId) {
        const [result] = await db.execute(
            'DELETE FROM user_likes WHERE user_id = ? AND target_type = ? AND target_id = ?',
            [userId, targetType, targetId]
        );
        return result.affectedRows > 0;
    }

    static async check(userId, targetType, targetId) {
        const [rows] = await db.execute(
            'SELECT * FROM user_likes WHERE user_id = ? AND target_type = ? AND target_id = ?',
            [userId, targetType, targetId]
        );
        return rows.length > 0;
    }

    static async toggle(userId, targetType, targetId) {
        const isLiked = await this.check(userId, targetType, targetId);
        
        if (isLiked) {
            await this.remove(userId, targetType, targetId);
        } else {
            await this.add(userId, targetType, targetId);
        }

        const [rows] = await db.execute(
            'SELECT COUNT(*) as count FROM user_likes WHERE target_type = ? AND target_id = ?',
            [targetType, targetId]
        );
        const likeCount = rows[0].count;
        
        return { 
            isLiked: !isLiked,
            likeCount
        };
    }

    static async getUserLikes(userId, targetType) {
        const [rows] = await db.execute(
            'SELECT target_id FROM user_likes WHERE user_id = ? AND target_type = ?',
            [userId, targetType]
        );
        return rows.map(row => row.target_id);
    }

    static async getLikeCount(targetType, targetId) {
        const [rows] = await db.execute(
            'SELECT COUNT(*) as count FROM user_likes WHERE target_type = ? AND target_id = ?',
            [targetType, targetId]
        );
        return rows[0].count;
    }
}

module.exports = LikeModel;
