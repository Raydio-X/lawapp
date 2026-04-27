const db = require('../config/database');
const bm25Engine = require('../services/bm25');
const sentenceEmbedding = require('../services/sentenceEmbedding');
const resultFusion = require('../services/resultFusion');

class CardModel {
    static async getList(params = {}) {
        const { page = 1, pageSize = 10, libraryId, chapterId, userId } = params;
        const offset = (page - 1) * pageSize;

        let sql = `SELECT c.*, l.name as library_name, ch.name as chapter_name,
                   (SELECT COUNT(*) FROM study_records sr WHERE sr.card_id = c.id AND sr.user_id = ?) as study_count,
                   (SELECT COUNT(*) FROM user_likes ul WHERE ul.target_type = 'card' AND ul.target_id = c.id AND ul.user_id = ?) as is_liked,
                   (SELECT COUNT(*) FROM favorites f WHERE f.target_type = 'card' AND f.target_id = c.id AND f.user_id = ?) as is_favorited,
                   (SELECT mastered FROM card_mastery cm WHERE cm.card_id = c.id AND cm.user_id = ?) as is_learned
                   FROM cards c 
                   LEFT JOIN libraries l ON c.library_id = l.id 
                   LEFT JOIN chapters ch ON c.chapter_id = ch.id 
                   WHERE 1=1`;
        const values = [userId || 0, userId || 0, userId || 0, userId || 0];

        if (libraryId) {
            sql += ' AND c.library_id = ?';
            values.push(libraryId);
        } else {
            sql += ' AND c.is_public = 1';
        }

        if (chapterId) {
            sql += ' AND c.chapter_id = ?';
            values.push(chapterId);
        }

        sql += ` ORDER BY c.created_at DESC LIMIT ${parseInt(pageSize)} OFFSET ${offset}`;

        const [rows] = await db.execute(sql, values);
        
        let countSql = 'SELECT COUNT(*) as total FROM cards WHERE 1=1';
        const countValues = [];
        if (libraryId) {
            countSql += ' AND library_id = ?';
            countValues.push(libraryId);
        } else {
            countSql += ' AND is_public = 1';
        }
        if (chapterId) {
            countSql += ' AND chapter_id = ?';
            countValues.push(chapterId);
        }

        const [countRows] = await db.execute(countSql, countValues);

        return {
            list: rows.map(row => ({
                ...row,
                tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : (row.tags || []),
                is_liked: row.is_liked > 0,
                is_favorited: row.is_favorited > 0,
                is_learned: row.is_learned === 1
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
            'INSERT INTO cards (library_id, chapter_id, question, answer, tags, created_by, is_public, is_hot) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [
                data.library_id || null,
                data.chapter_id || null,
                data.question,
                data.answer,
                JSON.stringify(data.tags || []),
                data.created_by,
                data.is_public !== undefined ? data.is_public : 1,
                data.is_hot !== undefined ? data.is_hot : 0
            ]
        );
        
        if (data.library_id) {
            await db.execute(
                'UPDATE libraries SET card_count = (SELECT COUNT(*) FROM cards WHERE library_id = ?) WHERE id = ?',
                [data.library_id, data.library_id]
            );
        }
        
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
        if (data.is_hot !== undefined) {
            fields.push('is_hot = ?');
            values.push(data.is_hot);
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
            if (card.library_id) {
                await db.execute(
                    'UPDATE libraries SET card_count = (SELECT COUNT(*) FROM cards WHERE library_id = ?) WHERE id = ?',
                    [card.library_id, card.library_id]
                );
            }
        }
    }

    static async getHotCards(limit = 10, userId = null, page = null, pageSize = null) {
        let sql = `SELECT c.*, l.name as library_name, l.subject,
             (SELECT COUNT(*) FROM user_likes ul WHERE ul.target_type = 'card' AND ul.target_id = c.id AND ul.user_id = ?) as is_liked,
             (SELECT COUNT(*) FROM favorites f WHERE f.target_type = 'card' AND f.target_id = c.id AND f.user_id = ?) as is_favorited,
             (SELECT mastered FROM card_mastery cm WHERE cm.card_id = c.id AND cm.user_id = ?) as is_learned
             FROM cards c 
             LEFT JOIN libraries l ON c.library_id = l.id 
             WHERE c.is_public = 1 AND c.is_hot = 1
             ORDER BY c.study_count DESC, c.like_count DESC`;
        
        let params = [userId || 0, userId || 0, userId || 0];
        
        if (page && pageSize) {
            const offset = (page - 1) * pageSize;
            sql += ` LIMIT ${parseInt(pageSize)} OFFSET ${parseInt(offset)}`;
        } else {
            sql += ` LIMIT ${parseInt(limit)}`;
        }
        
        const [rows] = await db.execute(sql, params);
        return rows.map(row => ({
            ...row,
            tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : (row.tags || []),
            is_liked: row.is_liked > 0,
            is_favorited: row.is_favorited > 0,
            is_learned: row.is_learned === 1
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

    static async updateLikeCount(id, count) {
        await db.execute(
            'UPDATE cards SET like_count = ? WHERE id = ?',
            [count, id]
        );
    }

    static async getByLibraryId(libraryId, userId = null) {
        const [rows] = await db.execute(
            `SELECT c.*, l.name as library_name
             FROM cards c 
             LEFT JOIN libraries l ON c.library_id = l.id 
             WHERE c.library_id = ?
             ORDER BY c.id ASC`,
            [libraryId]
        );
        return rows.map(row => ({
            ...row,
            tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : (row.tags || [])
        }));
    }

    static async batchUpdateChapter(cardIds, chapterId, userId) {
        if (!cardIds || cardIds.length === 0) {
            return { success: true, count: 0 };
        }

        const placeholders = cardIds.map(() => '?').join(',');
        const [result] = await db.execute(
            `UPDATE cards SET chapter_id = ? WHERE id IN (${placeholders}) AND created_by = ?`,
            [chapterId, ...cardIds, userId]
        );

        return { success: true, count: result.affectedRows };
    }

    static async getRelatedCards(cardId, userId = null, limit = 5) {
        const [cardRows] = await db.query(
            'SELECT question, answer, tags, created_by FROM cards WHERE id = ?',
            [cardId]
        );

        if (!cardRows || cardRows.length === 0) {
            return [];
        }

        const currentCard = cardRows[0];
        const searchText = `${currentCard.question} ${currentCard.answer}`;
        const currentTags = typeof currentCard.tags === 'string'
            ? JSON.parse(currentCard.tags)
            : (currentCard.tags || []);

        let bm25Results = [];
        let embeddingResults = [];
        let tagResults = [];

        try {
            bm25Results = await bm25Engine.search(searchText, [cardId], userId, limit * 3);
        } catch (error) {
            console.log('BM25 search error:', error.message);
        }

        try {
            embeddingResults = await sentenceEmbedding.search(searchText, currentTags, [cardId], userId, limit * 3);
        } catch (error) {
            console.log('Sentence embedding search error:', error.message);
        }

        if (currentTags && currentTags.length > 0) {
            try {
                tagResults = await this._searchByTags(currentTags, [cardId], userId, limit * 2);
            } catch (error) {
                console.log('Tag search error:', error.message);
            }
        }

        const fusedResults = resultFusion.fuse(bm25Results, embeddingResults, tagResults);
        const topIds = fusedResults.slice(0, limit).map(r => r.id);
        const scoreMap = new Map(fusedResults.map(r => [r.id, r]));

        if (topIds.length === 0) {
            return [];
        }

        const cards = await this._fetchCardsByIds(topIds, cardId, userId);

        const cardMap = new Map(cards.map(c => [c.id, c]));
        const orderedCards = [];
        for (const id of topIds) {
            const card = cardMap.get(id);
            if (card) {
                const scores = scoreMap.get(id);
                card.relevance = scores ? scores.score : 0;
                card.bm25Score = scores ? scores.bm25Score : 0;
                card.embeddingScore = scores ? scores.embeddingScore : 0;
                orderedCards.push(card);
            }
        }

        return orderedCards;
    }

    static async _searchByTags(tags, excludeIds = [], excludeUserId = null, limit = 10) {
        const tagConditions = [];
        const tagValues = [];
        for (const t of tags) {
            tagConditions.push('JSON_CONTAINS(c.tags, CAST(? AS JSON))');
            tagValues.push(JSON.stringify(t));
        }

        const excludeIdList = excludeIds.filter(id => id !== undefined && id !== null);
        let sql = `SELECT c.id, COUNT(*) as match_count
                 FROM cards c
                 WHERE c.is_public = 1`;
        
        if (excludeIdList.length > 0) {
            sql += ` AND c.id NOT IN (${excludeIdList.join(',')})`;
        }
        if (excludeUserId) {
            sql += ` AND (c.created_by IS NULL OR c.created_by != ?)`;
            tagValues.push(excludeUserId);
        }
        sql += ` AND (${tagConditions.join(' OR ')})`;
        sql += ` GROUP BY c.id ORDER BY match_count DESC, c.study_count DESC LIMIT ?`;

        const params = [...tagValues, limit];
        const [rows] = await db.query(sql, params);

        const maxMatch = Math.max(...rows.map(r => r.match_count), 1);
        return rows.map(row => ({
            id: row.id,
            score: row.match_count / maxMatch
        }));
    }

    static async _fetchCardsByIds(ids, excludeCardId = null, userId = null) {
        if (ids.length === 0) return [];

        const idList = ids.join(',');
        let sql = `SELECT c.*, l.name as library_name,
                (SELECT COUNT(*) FROM user_likes ul WHERE ul.target_type = 'card' AND ul.target_id = c.id AND ul.user_id = ?) as is_liked,
                (SELECT mastered FROM card_mastery cm WHERE cm.card_id = c.id AND cm.user_id = ?) as is_learned
         FROM cards c
         LEFT JOIN libraries l ON c.library_id = l.id
         WHERE c.id IN (${idList})`;
        
        if (excludeCardId) {
            sql += ` AND c.id != ${excludeCardId}`;
        }
        if (userId) {
            sql += ` AND (c.created_by IS NULL OR c.created_by != ${userId})`;
        }

        const [rows] = await db.query(sql, [userId || 0, userId || 0]);

        return rows.map(row => ({
            ...row,
            tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : (row.tags || []),
            is_liked: row.is_liked > 0,
            is_learned: row.is_learned === 1
        }));
    }
}

module.exports = CardModel;
