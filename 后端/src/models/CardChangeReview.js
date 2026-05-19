const db = require('../config/database');

const safeParseJSON = (str, defaultValue = null) => {
    if (!str) return defaultValue;
    try {
        return JSON.parse(str);
    } catch (e) {
        return defaultValue;
    }
};

class CardChangeReviewModel {
    static async create(data) {
        try {
            const [result] = await db.execute(
                `INSERT INTO card_change_reviews 
                (card_id, library_id, chapter_id, change_type, old_question, old_answer, old_tags, 
                 new_question, new_answer, new_tags, created_by) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    data.card_id || null,
                    data.library_id,
                    data.chapter_id || null,
                    data.change_type,
                    data.old_question || null,
                    data.old_answer || null,
                    data.old_tags ? JSON.stringify(data.old_tags) : null,
                    data.new_question,
                    data.new_answer,
                    data.new_tags ? JSON.stringify(data.new_tags) : null,
                    data.created_by
                ]
            );

            if (data.card_id) {
                await db.execute(
                    'UPDATE cards SET has_pending_change = 1 WHERE id = ?',
                    [data.card_id]
                );
            }

            return this.findById(result.insertId);
        } catch (error) {
            console.error('CardChangeReview.create error:', error);
            console.error('Error code:', error.code);
            if (error.code === 'ER_NO_SUCH_TABLE') {
                throw new Error('数据库表 card_change_reviews 不存在，请运行迁移脚本创建表结构');
            }
            throw error;
        }
    }

    static async findById(id) {
        const [rows] = await db.execute(
            `SELECT ccr.*, 
                    u.nickname as creator_name,
                    reviewer.nickname as reviewer_name,
                    l.name as library_name,
                    ch.name as chapter_name
             FROM card_change_reviews ccr
             LEFT JOIN users u ON ccr.created_by = u.id
             LEFT JOIN users reviewer ON ccr.reviewed_by = reviewer.id
             LEFT JOIN libraries l ON ccr.library_id = l.id
             LEFT JOIN chapters ch ON ccr.chapter_id = ch.id
             WHERE ccr.id = ?`,
            [id]
        );

        if (rows[0]) {
            rows[0].old_tags = safeParseJSON(rows[0].old_tags, null);
            rows[0].new_tags = safeParseJSON(rows[0].new_tags, []);
        }

        return rows[0];
    }

    static async getPendingList(params = {}) {
        const { page = 1, pageSize = 10, libraryId } = params;
        const offset = (page - 1) * pageSize;

        let sql = `SELECT ccr.*, 
                          u.nickname as creator_name,
                          l.name as library_name,
                          ch.name as chapter_name
                   FROM card_change_reviews ccr
                   LEFT JOIN users u ON ccr.created_by = u.id
                   LEFT JOIN libraries l ON ccr.library_id = l.id
                   LEFT JOIN chapters ch ON ccr.chapter_id = ch.id
                   WHERE ccr.status = 'pending'`;
        const values = [];

        if (libraryId) {
            sql += ' AND ccr.library_id = ?';
            values.push(libraryId);
        }

        sql += ` ORDER BY ccr.created_at DESC LIMIT ${parseInt(pageSize)} OFFSET ${offset}`;

        const [rows] = await db.execute(sql, values);

        let countSql = `SELECT COUNT(*) as total FROM card_change_reviews WHERE status = 'pending'`;
        const countValues = [];
        if (libraryId) {
            countSql += ' AND library_id = ?';
            countValues.push(libraryId);
        }

        const [countRows] = await db.execute(countSql, countValues);

        return {
            list: rows.map(row => ({
                ...row,
                old_tags: safeParseJSON(row.old_tags, null),
                new_tags: safeParseJSON(row.new_tags, [])
            })),
            pagination: {
                page: parseInt(page),
                pageSize: parseInt(pageSize),
                total: countRows[0].total,
                totalPages: Math.ceil(countRows[0].total / pageSize)
            }
        };
    }

    static async approve(id, reviewerId) {
        const review = await this.findById(id);
        if (!review) {
            throw new Error('审核记录不存在');
        }

        if (review.status !== 'pending') {
            throw new Error('该记录已审核');
        }

        const CardModel = require('./Card');

        if (review.change_type === 'create') {
            const card = await CardModel.create({
                library_id: review.library_id,
                chapter_id: review.chapter_id,
                question: review.new_question,
                answer: review.new_answer,
                tags: review.new_tags,
                created_by: review.created_by,
                is_public: 1
            });

            await db.execute(
                `UPDATE card_change_reviews 
                 SET status = 'approved', reviewed_by = ?, reviewed_at = NOW(), card_id = ? 
                 WHERE id = ?`,
                [reviewerId, card.id, id]
            );
        } else if (review.change_type === 'update') {
            await CardModel.update(review.card_id, {
                question: review.new_question,
                answer: review.new_answer,
                tags: review.new_tags,
                chapter_id: review.chapter_id
            });

            await db.execute(
                `UPDATE card_change_reviews 
                 SET status = 'approved', reviewed_by = ?, reviewed_at = NOW() 
                 WHERE id = ?`,
                [reviewerId, id]
            );

            await db.execute(
                'UPDATE cards SET has_pending_change = 0 WHERE id = ?',
                [review.card_id]
            );
        }

        return this.findById(id);
    }

    static async reject(id, reviewerId, note) {
        const review = await this.findById(id);
        if (!review) {
            throw new Error('审核记录不存在');
        }

        if (review.status !== 'pending') {
            throw new Error('该记录已审核');
        }

        await db.execute(
            `UPDATE card_change_reviews 
             SET status = 'rejected', review_note = ?, reviewed_by = ?, reviewed_at = NOW() 
             WHERE id = ?`,
            [note, reviewerId, id]
        );

        if (review.change_type === 'update' && review.card_id) {
            await db.execute(
                'UPDATE cards SET has_pending_change = 0 WHERE id = ?',
                [review.card_id]
            );
        }

        try {
            const MessageModel = require('./message');
            const changeTypeText = review.change_type === 'create' ? '新建' : '修改';
            const title = '卡片变更审核结果通知';
            const content = `您在知识库「${review.library_name || '未知知识库'}」中${changeTypeText}的卡片「${review.new_question ? review.new_question.substring(0, 30) : '未知'}」审核未通过。${note ? `原因：${note}` : ''}`;
            
            await MessageModel.create({
                user_id: review.created_by,
                title,
                content,
                type: 'system',
                sender_id: reviewerId
            });
        } catch (msgError) {
            console.error('发送审核驳回通知失败:', msgError);
        }

        return this.findById(id);
    }

    static async getByCardId(cardId) {
        const [rows] = await db.execute(
            `SELECT ccr.*, 
                    u.nickname as creator_name,
                    reviewer.nickname as reviewer_name
             FROM card_change_reviews ccr
             LEFT JOIN users u ON ccr.created_by = u.id
             LEFT JOIN users reviewer ON ccr.reviewed_by = reviewer.id
             WHERE ccr.card_id = ?
             ORDER BY ccr.created_at DESC`,
            [cardId]
        );

        return rows.map(row => ({
            ...row,
            old_tags: safeParseJSON(row.old_tags, null),
            new_tags: safeParseJSON(row.new_tags, [])
        }));
    }

    static async getMyReviews(userId, params = {}) {
        const { page = 1, pageSize = 10 } = params;
        const offset = (page - 1) * pageSize;

        const [rows] = await db.execute(
            `SELECT ccr.*, 
                    l.name as library_name,
                    ch.name as chapter_name
             FROM card_change_reviews ccr
             LEFT JOIN libraries l ON ccr.library_id = l.id
             LEFT JOIN chapters ch ON ccr.chapter_id = ch.id
             WHERE ccr.created_by = ?
             ORDER BY ccr.created_at DESC
             LIMIT ${parseInt(pageSize)} OFFSET ${offset}`,
            [userId]
        );

        const [countRows] = await db.execute(
            'SELECT COUNT(*) as total FROM card_change_reviews WHERE created_by = ?',
            [userId]
        );

        return {
            list: rows.map(row => ({
                ...row,
                old_tags: safeParseJSON(row.old_tags, null),
                new_tags: safeParseJSON(row.new_tags, [])
            })),
            pagination: {
                page: parseInt(page),
                pageSize: parseInt(pageSize),
                total: countRows[0].total,
                totalPages: Math.ceil(countRows[0].total / pageSize)
            }
        };
    }

    static async getLibrariesWithPendingChanges(params = {}) {
        const { page = 1, pageSize = 10 } = params;
        const offset = (page - 1) * pageSize;

        try {
            const [rows] = await db.execute(
                `SELECT 
                    l.id,
                    l.name,
                    l.subject,
                    l.description,
                    l.created_at,
                    u.nickname as creator_name,
                    COUNT(ccr.id) as pending_change_count
                 FROM libraries l
                 INNER JOIN card_change_reviews ccr ON ccr.library_id = l.id AND ccr.status = 'pending'
                 LEFT JOIN users u ON l.created_by = u.id
                 GROUP BY l.id
                 ORDER BY MAX(ccr.created_at) DESC
                 LIMIT ${parseInt(pageSize)} OFFSET ${offset}`
            );

            const [countRows] = await db.execute(
                `SELECT COUNT(DISTINCT library_id) as total 
                 FROM card_change_reviews 
                 WHERE status = 'pending'`
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
        } catch (error) {
            console.error('getLibrariesWithPendingChanges error:', error);
            if (error.code === 'ER_NO_SUCH_TABLE') {
                console.log('card_change_reviews table does not exist, returning empty list');
                return {
                    list: [],
                    pagination: {
                        page: parseInt(page),
                        pageSize: parseInt(pageSize),
                        total: 0,
                        totalPages: 0
                    }
                };
            }
            throw error;
        }
    }

    static async getPendingByLibraryId(libraryId, params = {}) {
        const { page = 1, pageSize = 20 } = params;
        const offset = (page - 1) * pageSize;

        const [rows] = await db.execute(
            `SELECT ccr.*, 
                    u.nickname as creator_name,
                    ch.name as chapter_name
             FROM card_change_reviews ccr
             LEFT JOIN users u ON ccr.created_by = u.id
             LEFT JOIN chapters ch ON ccr.chapter_id = ch.id
             WHERE ccr.library_id = ? AND ccr.status = 'pending'
             ORDER BY ccr.created_at DESC
             LIMIT ${parseInt(pageSize)} OFFSET ${offset}`,
            [libraryId]
        );

        const [countRows] = await db.execute(
            'SELECT COUNT(*) as total FROM card_change_reviews WHERE library_id = ? AND status = ?',
            [libraryId, 'pending']
        );

        return {
            list: rows.map(row => ({
                ...row,
                old_tags: safeParseJSON(row.old_tags, null),
                new_tags: safeParseJSON(row.new_tags, [])
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

module.exports = CardChangeReviewModel;
