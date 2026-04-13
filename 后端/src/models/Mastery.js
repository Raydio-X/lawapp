const db = require('../config/database');

class MasteryModel {
    static async toggle(userId, cardId, libraryId) {
        const [existing] = await db.execute(
            'SELECT * FROM card_mastery WHERE user_id = ? AND card_id = ?',
            [userId, cardId]
        );

        if (existing.length > 0) {
            const newMastered = existing[0].mastered ? 0 : 1;
            await db.execute(
                'UPDATE card_mastery SET mastered = ? WHERE user_id = ? AND card_id = ?',
                [newMastered, userId, cardId]
            );
            return {
                mastered: newMastered === 1,
                cardId: cardId
            };
        } else {
            await db.execute(
                'INSERT INTO card_mastery (user_id, card_id, library_id, mastered) VALUES (?, ?, ?, 1)',
                [userId, cardId, libraryId]
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

        if (existing.length > 0) {
            await db.execute(
                'UPDATE card_mastery SET mastered = ? WHERE user_id = ? AND card_id = ?',
                [mastered ? 1 : 0, userId, cardId]
            );
        } else {
            await db.execute(
                'INSERT INTO card_mastery (user_id, card_id, library_id, mastered) VALUES (?, ?, ?, ?)',
                [userId, cardId, libraryId, mastered ? 1 : 0]
            );
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
}

module.exports = MasteryModel;
