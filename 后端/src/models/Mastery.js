const db = require('../config/database');

class MasteryModel {
    static REVIEW_INTERVALS = [1, 1, 1, 1, 1, 1];

    static calculateNextReviewDate(reviewCount) {
        const today = new Date();
        const nextDate = new Date(today);
        nextDate.setDate(nextDate.getDate() + 1);
        return nextDate.toISOString().split('T')[0];
    }

    static async toggle(userId, cardId, libraryId) {
        const [existing] = await db.execute(
            'SELECT * FROM card_mastery WHERE user_id = ? AND card_id = ?',
            [userId, cardId]
        );

        if (existing.length > 0) {
            const newMastered = existing[0].mastered ? 0 : 1;
            const today = new Date().toISOString().split('T')[0];
            
            if (newMastered === 1) {
                const reviewCount = existing[0].review_count || 0;
                const nextReviewDate = this.calculateNextReviewDate(reviewCount);
                
                await db.execute(
                    `UPDATE card_mastery 
                     SET mastered = ?, next_review_date = ?, last_review_date = ?, review_count = review_count + 1 
                     WHERE user_id = ? AND card_id = ?`,
                    [newMastered, nextReviewDate, today, userId, cardId]
                );
            } else {
                await db.execute(
                    'UPDATE card_mastery SET mastered = ? WHERE user_id = ? AND card_id = ?',
                    [newMastered, userId, cardId]
                );
            }
            
            return {
                mastered: newMastered === 1,
                cardId: cardId
            };
        } else {
            const today = new Date().toISOString().split('T')[0];
            const nextReviewDate = this.calculateNextReviewDate(0);
            
            await db.execute(
                `INSERT INTO card_mastery (user_id, card_id, library_id, mastered, review_count, next_review_date, last_review_date) 
                 VALUES (?, ?, ?, 1, 1, ?, ?)`,
                [userId, cardId, libraryId, nextReviewDate, today]
            );
            return {
                mastered: true,
                cardId: cardId
            };
        }
    }

    static async setMastery(userId, cardId, libraryId, mastered) {
        const [existing] = await db.execute(
            'SELECT * FROM card_mastery WHERE user_id = ? AND card_id = ?',
            [userId, cardId]
        );

        const today = new Date().toISOString().split('T')[0];

        if (existing.length > 0) {
            if (mastered) {
                const reviewCount = existing[0].review_count || 0;
                const nextReviewDate = this.calculateNextReviewDate(reviewCount);
                
                await db.execute(
                    `UPDATE card_mastery 
                     SET mastered = ?, next_review_date = ?, last_review_date = ?, review_count = review_count + 1 
                     WHERE user_id = ? AND card_id = ?`,
                    [mastered ? 1 : 0, nextReviewDate, today, userId, cardId]
                );
            } else {
                await db.execute(
                    'UPDATE card_mastery SET mastered = ? WHERE user_id = ? AND card_id = ?',
                    [mastered ? 1 : 0, userId, cardId]
                );
            }
        } else {
            if (mastered) {
                const nextReviewDate = this.calculateNextReviewDate(0);
                await db.execute(
                    `INSERT INTO card_mastery (user_id, card_id, library_id, mastered, review_count, next_review_date, last_review_date) 
                     VALUES (?, ?, ?, 1, 1, ?, ?)`,
                    [userId, cardId, libraryId, nextReviewDate, today]
                );
            } else {
                await db.execute(
                    'INSERT INTO card_mastery (user_id, card_id, library_id, mastered) VALUES (?, ?, ?, ?)',
                    [userId, cardId, libraryId, mastered ? 1 : 0]
                );
            }
        }

        return {
            mastered: mastered,
            cardId: cardId
        };
    }

    static async getMasteryStatus(userId, cardId) {
        const [rows] = await db.execute(
            'SELECT mastered FROM card_mastery WHERE user_id = ? AND card_id = ?',
            [userId, cardId]
        );
        return rows.length > 0 ? rows[0].mastered === 1 : false;
    }

    static async getMasteryByLibrary(userId, libraryId) {
        const [rows] = await db.execute(
            'SELECT card_id, mastered FROM card_mastery WHERE user_id = ? AND library_id = ?',
            [userId, libraryId]
        );
        return rows;
    }

    static async getMasteryCount(userId, libraryId) {
        const [rows] = await db.execute(
            'SELECT COUNT(*) as count FROM card_mastery WHERE user_id = ? AND library_id = ? AND mastered = 1',
            [userId, libraryId]
        );
        return rows[0].count;
    }

    static async getReviewCards(userId) {
        const today = new Date().toISOString().split('T')[0];
        
        const [rows] = await db.execute(
            `SELECT cm.card_id, cm.library_id, cm.review_count, cm.next_review_date,
                    c.question, c.answer, c.tags, l.name as library_name
             FROM card_mastery cm
             JOIN cards c ON c.id = cm.card_id
             JOIN libraries l ON l.id = cm.library_id
             WHERE cm.user_id = ? 
             AND cm.mastered = 1 
             AND cm.next_review_date <= ?
             AND DATE(cm.last_review_date) < ?
             ORDER BY cm.next_review_date ASC`,
            [userId, today, today]
        );
        
        return rows.map(row => ({
            id: row.card_id,
            question: row.question,
            answer: row.answer,
            tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : (row.tags || []),
            libraryId: row.library_id,
            libraryName: row.library_name,
            reviewCount: row.review_count,
            nextReviewDate: row.next_review_date
        }));
    }

    static async getReviewCount(userId) {
        const today = new Date().toISOString().split('T')[0];
        
        const [rows] = await db.execute(
            `SELECT COUNT(*) as count 
             FROM card_mastery 
             WHERE user_id = ? 
             AND mastered = 1 
             AND next_review_date <= ?
             AND DATE(last_review_date) < ?`,
            [userId, today, today]
        );
        
        return rows[0].count;
    }
}

module.exports = MasteryModel;
