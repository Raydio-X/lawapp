const db = require('../config/database');
const FavoriteModel = require('./Favorite');

class LibraryModel {
    static async getList(params = {}) {
        const { page = 1, pageSize = 10, subject, userId, keyword } = params;
        const offset = (page - 1) * pageSize;
        
        let sql = `SELECT l.*, u.nickname as creator_name, 
                   (SELECT COUNT(*) FROM favorites f WHERE f.target_type = 'library' AND f.target_id = l.id) as favorite_count,
                   (SELECT COUNT(*) FROM user_likes ul WHERE ul.target_type = 'library' AND ul.target_id = l.id AND ul.user_id = ?) as is_liked,
                   (SELECT COUNT(*) FROM favorites f WHERE f.target_type = 'library' AND f.target_id = l.id AND f.user_id = ?) as is_favorited
                   FROM libraries l 
                   LEFT JOIN users u ON l.created_by = u.id 
                   WHERE l.is_public = 1 AND l.status = 'approved'`;
        const values = [userId || 0, userId || 0];

        if (subject) {
            sql += ' AND l.subject = ?';
            values.push(subject);
        }

        if (keyword) {
            sql += ' AND (l.name LIKE ? OR l.description LIKE ?)';
            values.push(`%${keyword}%`, `%${keyword}%`);
        }

        sql += ` ORDER BY l.created_at DESC LIMIT ${Number(pageSize)} OFFSET ${offset}`;

        const [rows] = await db.execute(sql, values);
        
        let countSql = 'SELECT COUNT(*) as total FROM libraries WHERE is_public = 1 AND status = \'approved\'';
        const countValues = [];
        if (subject) {
            countSql += ' AND subject = ?';
            countValues.push(subject);
        }
        if (keyword) {
            countSql += ' AND (name LIKE ? OR description LIKE ?)';
            countValues.push(`%${keyword}%`, `%${keyword}%`);
        }
        const [countRows] = await db.execute(countSql, countValues);

        return {
            list: rows.map(row => ({
                ...row,
                is_liked: row.is_liked > 0,
                is_favorited: row.is_favorited > 0
            })),
            pagination: {
                page: Number(page),
                pageSize: Number(pageSize),
                total: countRows[0].total,
                totalPages: Math.ceil(countRows[0].total / pageSize)
            }
        };
    }

    static async getMyLibraries(userId, params = {}) {
        const { page = 1, pageSize = 10 } = params;
        const offset = (page - 1) * pageSize;

        const [rows] = await db.execute(
            `SELECT l.*, 
             (SELECT COUNT(*) FROM cards c WHERE c.library_id = l.id) as card_count,
             (SELECT COUNT(*) FROM card_mastery cm 
              JOIN cards c ON c.id = cm.card_id 
              WHERE c.library_id = l.id AND cm.user_id = ? AND cm.mastered = 1) as learned_cards,
             (SELECT COUNT(*) FROM favorites f WHERE f.target_type = 'library' AND f.target_id = l.id) as favorite_count
             FROM libraries l 
             WHERE l.created_by = ? 
             ORDER BY l.created_at DESC 
             LIMIT ${parseInt(pageSize)} OFFSET ${offset}`,
            [userId, userId]
        );

        const [countRows] = await db.execute(
            'SELECT COUNT(*) as total FROM libraries WHERE created_by = ?',
            [userId]
        );

        return {
            list: rows.map(row => ({
                ...row,
                totalCards: row.card_count,
                learnedCards: row.learned_cards
            })),
            pagination: {
                page: parseInt(page),
                pageSize: parseInt(pageSize),
                total: countRows[0].total,
                totalPages: Math.ceil(countRows[0].total / pageSize)
            }
        };
    }

    static async getRecommended(limit = 6) {
        const [rows] = await db.execute(
            `SELECT l.*, u.nickname as creator_name,
             (SELECT COUNT(*) FROM favorites f WHERE f.target_type = 'library' AND f.target_id = l.id) as favorite_count
             FROM libraries l 
             LEFT JOIN users u ON l.created_by = u.id 
             WHERE l.is_public = 1 AND l.status = 'approved'
             ORDER BY l.view_count DESC, l.favorite_count DESC 
             LIMIT ${parseInt(limit)}`
        );
        return rows;
    }

    static async findById(id, userId = null) {
        const [rows] = await db.execute(
            `SELECT l.*, u.nickname as creator_name,
             (SELECT COUNT(*) FROM cards c WHERE c.library_id = l.id) as card_count,
             (SELECT COUNT(*) FROM favorites f WHERE f.target_type = 'library' AND f.target_id = l.id) as favorite_count,
             (SELECT COUNT(*) FROM favorites f WHERE f.target_type = 'library' AND f.target_id = l.id AND f.user_id = ?) as is_favorited
             FROM libraries l 
             LEFT JOIN users u ON l.created_by = u.id 
             WHERE l.id = ?`,
            [userId || 0, id]
        );
        const row = rows[0];
        if (row) {
            row.is_favorited = row.is_favorited > 0;
        }
        return row;
    }

    static async create(data) {
        const isPublic = data.is_public !== undefined ? data.is_public : 1;
        const status = 'approved';
        
        const [result] = await db.execute(
            'INSERT INTO libraries (name, subject, description, cover_image, created_by, is_public, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [data.name, data.subject, data.description || '', data.cover_image || '', data.created_by, isPublic, status]
        );
        return this.findById(result.insertId);
    }

    static async update(id, data) {
        if (data.is_public !== undefined && data.is_public === 0) {
            const library = await this.findById(id);
            if (library && library.is_public === 1) {
                await FavoriteModel.removeByLibrary(id);
            }
        }

        const fields = [];
        const values = [];

        if (data.name !== undefined) {
            fields.push('name = ?');
            values.push(data.name);
        }
        if (data.subject !== undefined) {
            fields.push('subject = ?');
            values.push(data.subject);
        }
        if (data.description !== undefined) {
            fields.push('description = ?');
            values.push(data.description);
        }
        if (data.cover_image !== undefined) {
            fields.push('cover_image = ?');
            values.push(data.cover_image);
        }
        if (data.is_public !== undefined) {
            fields.push('is_public = ?');
            values.push(data.is_public);
        }

        if (fields.length === 0) return this.findById(id);

        values.push(id);
        await db.execute(
            `UPDATE libraries SET ${fields.join(', ')} WHERE id = ?`,
            values
        );
        return this.findById(id);
    }

    static async delete(id) {
        const [cardIds] = await db.execute(
            'SELECT id FROM cards WHERE library_id = ?',
            [id]
        );
        
        if (cardIds.length > 0) {
            const cardIdList = cardIds.map(c => c.id);
            
            await db.execute(
                `DELETE FROM card_mastery WHERE card_id IN (${cardIdList.map(() => '?').join(',')})`,
                cardIdList
            );
            
            await db.execute(
                `DELETE FROM study_records WHERE card_id IN (${cardIdList.map(() => '?').join(',')})`,
                cardIdList
            );
            
            await db.execute(
                `DELETE FROM user_likes WHERE target_type = 'card' AND target_id IN (${cardIdList.map(() => '?').join(',')})`,
                cardIdList
            );
            
            await db.execute(
                `DELETE FROM favorites WHERE target_type = 'card' AND target_id IN (${cardIdList.map(() => '?').join(',')})`,
                cardIdList
            );
            
            await db.execute(
                `DELETE FROM comments WHERE card_id IN (${cardIdList.map(() => '?').join(',')})`,
                cardIdList
            );
        }
        
        await db.execute('DELETE FROM cards WHERE library_id = ?', [id]);
        
        await db.execute('DELETE FROM chapters WHERE library_id = ?', [id]);
        
        await FavoriteModel.removeByLibrary(id);
        
        await db.execute(
            'DELETE FROM user_likes WHERE target_type = \'library\' AND target_id = ?',
            [id]
        );
        
        await db.execute('DELETE FROM libraries WHERE id = ?', [id]);
    }

    static async incrementViewCount(id) {
        await db.execute(
            'UPDATE libraries SET view_count = view_count + 1 WHERE id = ?',
            [id]
        );
    }

    static async getCategories() {
        const [rows] = await db.execute(
            `SELECT subject, COUNT(*) as count FROM libraries WHERE is_public = 1 GROUP BY subject ORDER BY count DESC`
        );
        return rows;
    }

    static async incrementLikeCount(id) {
        await db.execute(
            'UPDATE libraries SET like_count = like_count + 1 WHERE id = ?',
            [id]
        );
        
        const [rows] = await db.execute(
            'SELECT like_count FROM libraries WHERE id = ?',
            [id]
        );
        
        return rows[0]?.like_count || 0;
    }

    static async decrementLikeCount(id) {
        await db.execute(
            'UPDATE libraries SET like_count = GREATEST(like_count - 1, 0) WHERE id = ?',
            [id]
        );
        
        const [rows] = await db.execute(
            'SELECT like_count FROM libraries WHERE id = ?',
            [id]
        );
        
        return rows[0]?.like_count || 0;
    }

    static async updateLikeCount(id, count) {
        await db.execute(
            'UPDATE libraries SET like_count = ? WHERE id = ?',
            [count, id]
        );
    }

    static async getPendingList(params = {}) {
        const { page = 1, pageSize = 10 } = params;
        const offset = (page - 1) * pageSize;

        const [rows] = await db.execute(
            `SELECT l.*, u.nickname as creator_name,
             (SELECT COUNT(*) FROM cards c WHERE c.library_id = l.id) as card_count
             FROM libraries l 
             LEFT JOIN users u ON l.created_by = u.id 
             WHERE l.status = 'pending'
             ORDER BY l.created_at ASC 
             LIMIT ${parseInt(pageSize)} OFFSET ${offset}`
        );

        const [countRows] = await db.execute(
            "SELECT COUNT(*) as total FROM libraries WHERE status = 'pending'"
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

    static async approve(id, reviewerId, note = '') {
        await db.execute(
            `UPDATE libraries 
             SET status = 'approved', 
                 review_note = ?, 
                 reviewed_by = ?, 
                 reviewed_at = NOW() 
             WHERE id = ?`,
            [note, reviewerId, id]
        );

        await db.execute(
            `INSERT INTO library_reviews (library_id, reviewer_id, action, note)
             VALUES (?, ?, 'approve', ?)`,
            [id, reviewerId, note]
        );

        return this.findById(id);
    }

    static async reject(id, reviewerId, note = '') {
        await db.execute(
            `UPDATE libraries 
             SET status = 'rejected', 
                 review_note = ?, 
                 reviewed_by = ?, 
                 reviewed_at = NOW() 
             WHERE id = ?`,
            [note, reviewerId, id]
        );

        await db.execute(
            `INSERT INTO library_reviews (library_id, reviewer_id, action, note)
             VALUES (?, ?, 'reject', ?)`,
            [id, reviewerId, note]
        );

        return this.findById(id);
    }

    static async getReviewHistory(libraryId) {
        const [rows] = await db.execute(
            `SELECT r.*, u.nickname as reviewer_name
             FROM library_reviews r
             LEFT JOIN users u ON r.reviewer_id = u.id
             WHERE r.library_id = ?
             ORDER BY r.created_at DESC`,
            [libraryId]
        );
        return rows;
    }
}

module.exports = LibraryModel;
