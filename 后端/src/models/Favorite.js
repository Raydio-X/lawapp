const db = require('../config/database');

class FavoriteModel {
    static async getList(userId, params = {}) {
        const { page = 1, pageSize = 10, type } = params;
        const offset = (page - 1) * pageSize;

        let sql = `SELECT f.*, 
                   CASE 
                     WHEN f.target_type = 'library' THEN (SELECT name FROM libraries WHERE id = f.target_id)
                     WHEN f.target_type = 'card' THEN (SELECT question FROM cards WHERE id = f.target_id)
                   END as target_name
                   FROM favorites f
                   WHERE f.user_id = ?`;
        const values = [userId];

        if (type) {
            sql += ' AND f.target_type = ?';
            values.push(type);
        }

        sql += ` ORDER BY f.created_at DESC LIMIT ${parseInt(pageSize)} OFFSET ${offset}`;

        const [rows] = await db.execute(sql, values);

        const countValues = [userId];
        let countSql = 'SELECT COUNT(*) as total FROM favorites WHERE user_id = ?';
        if (type) {
            countSql += ' AND target_type = ?';
            countValues.push(type);
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

    static async add(userId, targetType, targetId) {
        try {
            const [result] = await db.execute(
                'INSERT INTO favorites (user_id, target_type, target_id) VALUES (?, ?, ?)',
                [userId, targetType, targetId]
            );
            return { success: true, id: result.insertId };
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                return { success: false, message: 'Already favorited' };
            }
            throw error;
        }
    }

    static async remove(userId, targetType, targetId) {
        const [result] = await db.execute(
            'DELETE FROM favorites WHERE user_id = ? AND target_type = ? AND target_id = ?',
            [userId, targetType, targetId]
        );
        return result.affectedRows > 0;
    }

    static async check(userId, targetType, targetId) {
        const [rows] = await db.execute(
            'SELECT * FROM favorites WHERE user_id = ? AND target_type = ? AND target_id = ?',
            [userId, targetType, targetId]
        );
        return rows.length > 0;
    }

    static async toggle(userId, targetType, targetId) {
        const isFavorited = await this.check(userId, targetType, targetId);
        
        if (isFavorited) {
            await this.remove(userId, targetType, targetId);
        } else {
            await this.add(userId, targetType, targetId);
        }

        const totalCount = await this.getCount(userId);
        const typeCount = await this.getCount(userId, targetType);
        
        let favoriteCount = 0;
        if (targetType === 'library') {
            const [rows] = await db.execute(
                'SELECT COUNT(*) as count FROM favorites WHERE target_type = ? AND target_id = ?',
                [targetType, targetId]
            );
            favoriteCount = rows[0].count;
        } else if (targetType === 'card') {
            const [rows] = await db.execute(
                'SELECT COUNT(*) as count FROM favorites WHERE target_type = ? AND target_id = ?',
                [targetType, targetId]
            );
            favoriteCount = rows[0].count;
        }
        
        return { 
            isFavorited: !isFavorited,
            totalCount,
            typeCount,
            favoriteCount
        };
    }

    static async getCount(userId, targetType = null) {
        let sql = 'SELECT COUNT(*) as count FROM favorites WHERE user_id = ?';
        const values = [userId];

        if (targetType) {
            sql += ' AND target_type = ?';
            values.push(targetType);
        }

        const [rows] = await db.execute(sql, values);
        return rows[0].count;
    }

    static async removeByTarget(targetType, targetId) {
        const [result] = await db.execute(
            'DELETE FROM favorites WHERE target_type = ? AND target_id = ?',
            [targetType, targetId]
        );
        return result.affectedRows;
    }

    static async removeByLibrary(libraryId) {
        const [cardRows] = await db.execute(
            'SELECT id FROM cards WHERE library_id = ?',
            [libraryId]
        );
        
        let totalRemoved = 0;
        
        totalRemoved += await this.removeByTarget('library', libraryId);
        
        for (const card of cardRows) {
            totalRemoved += await this.removeByTarget('card', card.id);
        }
        
        return totalRemoved;
    }
}

module.exports = FavoriteModel;
