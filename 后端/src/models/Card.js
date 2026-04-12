const db = require('../config/database');

class CardModel {
    static async getList(params = {}) {
        const { page = 1, pageSize = 10, libraryId, chapterId, userId } = params;
        const offset = (page - 1) * pageSize;

        let sql = `SELECT c.*, l.name as library_name, ch.name as chapter_name,
                   (SELECT COUNT(*) FROM study_records sr WHERE sr.card_id = c.id AND sr.user_id = ?) as study_count
                   FROM cards c 
                   LEFT JOIN libraries l ON c.library_id = l.id 
                   LEFT JOIN chapters ch ON c.chapter_id = ch.id 
                   WHERE c.is_public = 1`;
        const values = [userId || 0];

        if (libraryId) {
            sql += ' AND c.library_id = ?';
            values.push(libraryId);
        }

        if (chapterId) {
            sql += ' AND c.chapter_id = ?';
            values.push(chapterId);
        }

        sql += ` ORDER BY c.created_at DESC LIMIT ${parseInt(pageSize)} OFFSET ${offset}`;

        const [rows] = await db.execute(sql, values);
        
        let countSql = 'SELECT COUNT(*) as total FROM cards WHERE is_public = 1';
        const countValues = [];
        if (libraryId) {
            countSql += ' AND library_id = ?';
            countValues.push(libraryId);
        }
        if (chapterId) {
            countSql += ' AND chapter_id = ?';
            countValues.push(chapterId);
        }

        const [countRows] = await db.execute(countSql, countValues);

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

    static async findById(id, userId = null) {
        let sql = `SELECT c.*, l.name as library_name, ch.name as chapter_name,
                   (SELECT COUNT(*) FROM study_records sr WHERE sr.card_id = c.id AND sr.user_id = ?) as study_count
                   FROM cards c 
                   LEFT JOIN libraries l ON c.library_id = l.id 
                   LEFT JOIN chapters ch ON c.chapter_id = ch.id 
                   WHERE c.id = ?`;
        
        const [rows] = await db.execute(sql, [userId || 0, id]);
        
        if (rows[0]) {
            rows[0].tags = typeof rows[0].tags === 'string' ? JSON.parse(rows[0].tags) : (rows[0].tags || []);
        }
        
        return rows[0];
    }

    static async create(data) {
        const [result] = await db.execute(
            'INSERT INTO cards (library_id, chapter_id, question, answer, tags, created_by, is_public) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [
                data.library_id,
                data.chapter_id || null,
                data.question,
                data.answer,
                JSON.stringify(data.tags || []),
                data.created_by,
                data.is_public !== undefined ? data.is_public : 1
            ]
        );
        
        await db.execute(
            'UPDATE libraries SET card_count = (SELECT COUNT(*) FROM cards WHERE library_id = ?) WHERE id = ?',
            [data.library_id, data.library_id]
        );
        
        return this.findById(result.insertId);
    }

    static async update(id, data) {
        const fields = [];
        const values = [];

        if (data.question !== undefined) {
            fields.push('question = ?');
            values.push(data.question);
        }
        if (data.answer !== undefined) {
            fields.push('answer = ?');
            values.push(data.answer);
        }
        if (data.tags !== undefined) {
            fields.push('tags = ?');
            values.push(JSON.stringify(data.tags));
        }
        if (data.chapter_id !== undefined) {
            fields.push('chapter_id = ?');
            values.push(data.chapter_id);
        }
        if (data.is_public !== undefined) {
            fields.push('is_public = ?');
            values.push(data.is_public);
        }

        if (fields.length === 0) return this.findById(id);

        values.push(id);
        await db.execute(
            `UPDATE cards SET ${fields.join(', ')} WHERE id = ?`,
            values
        );
        return this.findById(id);
    }

    static async delete(id) {
        const card = await this.findById(id);
        if (card) {
            await db.execute('DELETE FROM cards WHERE id = ?', [id]);
            await db.execute(
                'UPDATE libraries SET card_count = (SELECT COUNT(*) FROM cards WHERE library_id = ?) WHERE id = ?',
                [card.library_id, card.library_id]
            );
        }
    }

    static async getHotCards(limit = 10) {
        const [rows] = await db.execute(
            `SELECT c.*, l.name as library_name, l.subject
             FROM cards c 
             LEFT JOIN libraries l ON c.library_id = l.id 
             WHERE c.is_public = 1 
             ORDER BY c.study_count DESC, c.like_count DESC 
             LIMIT ${parseInt(limit)}`
        );
        return rows.map(row => ({
            ...row,
            tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : (row.tags || [])
        }));
    }

    static async search(keyword, params = {}) {
        const { page = 1, pageSize = 10 } = params;
        const offset = (page - 1) * pageSize;

        const [rows] = await db.execute(
            `SELECT c.*, l.name as library_name, l.subject
             FROM cards c 
             LEFT JOIN libraries l ON c.library_id = l.id 
             WHERE c.is_public = 1 AND (c.question LIKE ? OR c.answer LIKE ?)
             ORDER BY c.study_count DESC
             LIMIT ${parseInt(pageSize)} OFFSET ${offset}`,
            [`%${keyword}%`, `%${keyword}%`]
        );

        const [countRows] = await db.execute(
            `SELECT COUNT(*) as total FROM cards WHERE is_public = 1 AND (question LIKE ? OR answer LIKE ?)`,
            [`%${keyword}%`, `%${keyword}%`]
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

    static async getNext(id, libraryId) {
        const [rows] = await db.execute(
            `SELECT * FROM cards WHERE library_id = ? AND id > ? AND is_public = 1 ORDER BY id ASC LIMIT 1`,
            [libraryId, id]
        );
        return rows[0];
    }

    static async getPrev(id, libraryId) {
        const [rows] = await db.execute(
            `SELECT * FROM cards WHERE library_id = ? AND id < ? AND is_public = 1 ORDER BY id DESC LIMIT 1`,
            [libraryId, id]
        );
        return rows[0];
    }

    static async getRandom(libraryId) {
        const [rows] = await db.execute(
            `SELECT * FROM cards WHERE library_id = ? AND is_public = 1 ORDER BY RAND() LIMIT 1`,
            [libraryId]
        );
        return rows[0];
    }

    static async incrementStudyCount(id) {
        await db.execute(
            'UPDATE cards SET study_count = study_count + 1 WHERE id = ?',
            [id]
        );
    }

    static async incrementLikeCount(id) {
        await db.execute(
            'UPDATE cards SET like_count = like_count + 1 WHERE id = ?',
            [id]
        );
        
        const [rows] = await db.execute(
            'SELECT like_count FROM cards WHERE id = ?',
            [id]
        );
        
        return rows[0]?.like_count || 0;
    }

    static async decrementLikeCount(id) {
        await db.execute(
            'UPDATE cards SET like_count = GREATEST(like_count - 1, 0) WHERE id = ?',
            [id]
        );
        
        const [rows] = await db.execute(
            'SELECT like_count FROM cards WHERE id = ?',
            [id]
        );
        
        return rows[0]?.like_count || 0;
    }
}

module.exports = CardModel;
