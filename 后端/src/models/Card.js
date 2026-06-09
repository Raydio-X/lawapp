const db = require('../config/database');
const bm25Engine = require('../services/bm25');
const sentenceEmbedding = require('../services/sentenceEmbedding');
const resultFusion = require('../services/resultFusion');

class CardModel {
    static async getList(params = {}) {
        const { page = 1, pageSize = 10, libraryId, chapterId, userId } = params;
        const offset = (page - 1) * pageSize;

        let sql = `SELECT c.*, l.name as library_name, ch.name as chapter_name, ch.parent_id as chapter_parent_id,
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

        if (libraryId) {
            sql += ` ORDER BY 
                COALESCE(ch.parent_id, 0) ASC,
                COALESCE(ch.id, 0) ASC,
                c.id ASC
                LIMIT ${parseInt(pageSize)} OFFSET ${offset}`;
        } else {
            sql += ` ORDER BY c.created_at DESC LIMIT ${parseInt(pageSize)} OFFSET ${offset}`;
        }

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
                keywords: typeof row.keywords === 'string' ? JSON.parse(row.keywords) : (row.keywords || []),
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
            rows[0].keywords = typeof rows[0].keywords === 'string' ? JSON.parse(rows[0].keywords) : (rows[0].keywords || []);
        }
        
        return rows[0];
    }

    static async create(data) {
        const [result] = await db.execute(
            'INSERT INTO cards (library_id, chapter_id, question, answer, tags, keywords, created_by, is_public, is_hot) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
                data.library_id || null,
                data.chapter_id || null,
                data.question,
                data.answer,
                JSON.stringify(data.tags || []),
                JSON.stringify(data.keywords || []),
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
        const { page = 1, pageSize = 10, userId = null } = params;
        const offset = (page - 1) * pageSize;

        let sql, countSql, queryParams, countParams;

        if (userId) {
            // 已登录用户：搜索公开知识库中的卡片 + 自己个人知识库中的卡片
            // 优化排序：标题匹配优先，内容匹配次之
            sql = `SELECT c.*, l.name as library_name, l.subject,
                   CASE 
                     WHEN c.question LIKE ? THEN 1 
                     ELSE 2 
                   END as match_priority
                   FROM cards c 
                   LEFT JOIN libraries l ON c.library_id = l.id 
                   WHERE (l.is_public = 1 OR l.created_by = ?) AND (c.question LIKE ? OR c.answer LIKE ?)
                   ORDER BY match_priority ASC, c.study_count DESC
                   LIMIT ${parseInt(pageSize)} OFFSET ${offset}`;
            countSql = `SELECT COUNT(*) as total 
                        FROM cards c
                        LEFT JOIN libraries l ON c.library_id = l.id 
                        WHERE (l.is_public = 1 OR l.created_by = ?) AND (c.question LIKE ? OR c.answer LIKE ?)`;
            queryParams = [`%${keyword}%`, userId, `%${keyword}%`, `%${keyword}%`];
            countParams = [userId, `%${keyword}%`, `%${keyword}%`];
        } else {
            // 未登录用户：只搜索公开知识库中的卡片
            // 优化排序：标题匹配优先，内容匹配次之
            sql = `SELECT c.*, l.name as library_name, l.subject,
                   CASE 
                     WHEN c.question LIKE ? THEN 1 
                     ELSE 2 
                   END as match_priority
                   FROM cards c 
                   LEFT JOIN libraries l ON c.library_id = l.id 
                   WHERE l.is_public = 1 AND (c.question LIKE ? OR c.answer LIKE ?)
                   ORDER BY match_priority ASC, c.study_count DESC
                   LIMIT ${parseInt(pageSize)} OFFSET ${offset}`;
            countSql = `SELECT COUNT(*) as total 
                        FROM cards c
                        LEFT JOIN libraries l ON c.library_id = l.id 
                        WHERE l.is_public = 1 AND (c.question LIKE ? OR c.answer LIKE ?)`;
            queryParams = [`%${keyword}%`, `%${keyword}%`, `%${keyword}%`];
            countParams = [`%${keyword}%`, `%${keyword}%`];
        }

        const [rows] = await db.execute(sql, queryParams);
        const [countRows] = await db.execute(countSql, countParams);

        return {
            list: rows.map(row => {
                const { match_priority, ...rest } = row;
                return {
                    ...rest,
                    tags: typeof rest.tags === 'string' ? JSON.parse(rest.tags) : (rest.tags || [])
                };
            }),
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

    static async batchUpdateChapter(cardIds, chapterId, userId, libraryId = null) {
        if (!cardIds || cardIds.length === 0) {
            return { success: true, count: 0 };
        }

        const placeholders = cardIds.map(() => '?').join(',');
        
        if (libraryId) {
            const [result] = await db.execute(
                `UPDATE cards SET chapter_id = ?, library_id = ? WHERE id IN (${placeholders}) AND created_by = ?`,
                [chapterId, libraryId, ...cardIds, userId]
            );
            return { success: true, count: result.affectedRows };
        } else {
            const [result] = await db.execute(
                `UPDATE cards SET chapter_id = ? WHERE id IN (${placeholders}) AND created_by = ?`,
                [chapterId, ...cardIds, userId]
            );
            return { success: true, count: result.affectedRows };
        }
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
            bm25Results = await bm25Engine.search(searchText, [cardId], null, limit * 3);
        } catch (error) {
            console.error('BM25 search error:', error.message);
        }

        try {
            embeddingResults = await sentenceEmbedding.search(searchText, currentTags, [cardId], null, limit * 3);
        } catch (error) {
            console.error('Sentence embedding search error:', error.message);
        }

        if (currentTags && currentTags.length > 0) {
            try {
                tagResults = await this._searchByTags(currentTags, [cardId], userId, limit * 2);
            } catch (error) {
                console.error('Tag search error:', error.message);
            }
        }

        let fusedResults = resultFusion.fuse(bm25Results, embeddingResults, tagResults);

        // 如果所有智能搜索都没有结果，使用简单的 LIKE 搜索作为 fallback
        if (fusedResults.length === 0) {
            try {
                const keywords = searchText.split(/\s+/).filter(w => w.length > 1).slice(0, 5);
                if (keywords.length > 0) {
                    const likeConditions = keywords.map(() => '(c.question LIKE ? OR c.answer LIKE ?)').join(' OR ');
                    const likeParams = keywords.flatMap(k => [`%${k}%`, `%${k}%`]);
                    
                    let fallbackSql;
                    let fallbackParams;
                    
                    if (userId) {
                        // 已登录用户：搜索公开知识库 + 自己的知识库
                        fallbackSql = `SELECT c.id FROM cards c
                                       LEFT JOIN libraries l ON c.library_id = l.id
                                       WHERE c.id != ? AND (l.is_public = 1 OR l.created_by = ?)
                                       AND (${likeConditions})
                                       ORDER BY c.study_count DESC 
                                       LIMIT ?`;
                        fallbackParams = [cardId, userId, ...likeParams, limit * 2];
                    } else {
                        // 未登录用户：只搜索公开知识库
                        fallbackSql = `SELECT c.id FROM cards c
                                       LEFT JOIN libraries l ON c.library_id = l.id
                                       WHERE c.id != ? AND l.is_public = 1
                                       AND (${likeConditions})
                                       ORDER BY c.study_count DESC 
                                       LIMIT ?`;
                        fallbackParams = [cardId, ...likeParams, limit * 2];
                    }
                    
                    const [likeRows] = await db.execute(fallbackSql, fallbackParams);
                    fusedResults = likeRows.map(row => ({ id: row.id, score: 0.5 }));
                }
            } catch (error) {
                console.error('Fallback LIKE search error:', error.message);
            }
        }

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

    static async _searchByTags(tags, excludeIds = [], userId = null, limit = 10) {
        const tagConditions = [];
        const tagValues = [];
        for (const t of tags) {
            tagConditions.push('JSON_CONTAINS(c.tags, CAST(? AS JSON))');
            tagValues.push(JSON.stringify(t));
        }

        const excludeIdList = excludeIds.filter(id => id !== undefined && id !== null);
        let sql;
        let params;
        
        if (userId) {
            // 已登录用户：搜索公开知识库 + 自己的知识库
            sql = `SELECT c.id, COUNT(*) as match_count
                   FROM cards c
                   LEFT JOIN libraries l ON c.library_id = l.id
                   WHERE (l.is_public = 1 OR l.created_by = ?)`;
            params = [userId, ...tagValues];
        } else {
            // 未登录用户：只搜索公开知识库
            sql = `SELECT c.id, COUNT(*) as match_count
                   FROM cards c
                   LEFT JOIN libraries l ON c.library_id = l.id
                   WHERE l.is_public = 1`;
            params = [...tagValues];
        }
        
        if (excludeIdList.length > 0) {
            sql += ` AND c.id NOT IN (${excludeIdList.join(',')})`;
        }
        sql += ` AND (${tagConditions.join(' OR ')})`;
        sql += ` GROUP BY c.id ORDER BY match_count DESC, c.study_count DESC LIMIT ?`;

        params.push(limit);
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

        const [rows] = await db.query(sql, [userId || 0, userId || 0]);

        return rows.map(row => ({
            ...row,
            tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : (row.tags || []),
            is_liked: row.is_liked > 0,
            is_learned: row.is_learned === 1
        }));
    }

    static async rateDifficulty(cardId, rating) {
        const [card] = await db.execute(
            'SELECT difficulty_rating, difficulty_count FROM cards WHERE id = ?',
            [cardId]
        );
        
        if (!card || card.length === 0) {
            throw new Error('卡片不存在');
        }
        
        const currentRating = parseFloat(card[0].difficulty_rating) || 0;
        const currentCount = parseInt(card[0].difficulty_count) || 0;
        
        const newCount = currentCount + 1;
        const newRating = ((currentRating * currentCount) + rating) / newCount;
        
        await db.execute(
            'UPDATE cards SET difficulty_rating = ?, difficulty_count = ? WHERE id = ?',
            [newRating.toFixed(2), newCount, cardId]
        );
        
        return {
            difficultyRating: parseFloat(newRating.toFixed(2)),
            difficultyCount: newCount
        };
    }

    static async getMyCards(userId, params = {}) {
        const { page = 1, pageSize = 20 } = params;
        const offset = (page - 1) * pageSize;

        const [rows] = await db.execute(
            `SELECT c.*, l.name as library_name
             FROM cards c 
             LEFT JOIN libraries l ON c.library_id = l.id 
             WHERE c.created_by = ?
             ORDER BY c.created_at DESC
             LIMIT ${parseInt(pageSize)} OFFSET ${offset}`,
            [userId]
        );

        const [countRows] = await db.execute(
            'SELECT COUNT(*) as total FROM cards WHERE created_by = ?',
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
}

module.exports = CardModel;
