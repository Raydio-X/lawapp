const db = require('../config/database');

class CardLinkModel {
    static async createTable() {
        const sql = `
            CREATE TABLE IF NOT EXISTS card_links (
                id INT AUTO_INCREMENT PRIMARY KEY,
                card_id INT NOT NULL,
                linked_card_id INT NOT NULL,
                user_id INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_link (card_id, linked_card_id, user_id),
                FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE,
                FOREIGN KEY (linked_card_id) REFERENCES cards(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `;
        await db.execute(sql);
    }

    static async addLink(cardId, linkedCardId, userId) {
        try {
            const [result] = await db.execute(
                'INSERT IGNORE INTO card_links (card_id, linked_card_id, user_id) VALUES (?, ?, ?)',
                [cardId, linkedCardId, userId]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Add link error:', error);
            return false;
        }
    }

    static async addLinks(cardId, linkedCardIds, userId) {
        let successCount = 0;
        for (const linkedId of linkedCardIds) {
            try {
                const [result] = await db.execute(
                    'INSERT IGNORE INTO card_links (card_id, linked_card_id, user_id) VALUES (?, ?, ?)',
                    [cardId, linkedId, userId]
                );
                if (result.affectedRows > 0) {
                    successCount++;
                }
            } catch (error) {
                console.error('Add link error for card', linkedId, error);
            }
        }
        return successCount;
    }

    static async removeLink(cardId, linkedCardId, userId) {
        try {
            const [result] = await db.execute(
                'DELETE FROM card_links WHERE card_id = ? AND linked_card_id = ? AND user_id = ?',
                [cardId, linkedCardId, userId]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Remove link error:', error);
            return false;
        }
    }

    static async getLinkedCards(cardId, userId) {
        const sql = `
            SELECT c.*, l.name as library_name
            FROM card_links cl
            JOIN cards c ON cl.linked_card_id = c.id
            LEFT JOIN libraries l ON c.library_id = l.id
            WHERE cl.card_id = ? AND cl.user_id = ?
            ORDER BY cl.created_at DESC
        `;
        const [rows] = await db.execute(sql, [cardId, userId]);
        return rows.map(row => ({
            ...row,
            tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : (row.tags || [])
        }));
    }

    static async getLinksByUser(userId) {
        const sql = `
            SELECT cl.*, c1.question as card_question, c2.question as linked_card_question
            FROM card_links cl
            JOIN cards c1 ON cl.card_id = c1.id
            JOIN cards c2 ON cl.linked_card_id = c2.id
            WHERE cl.user_id = ?
            ORDER BY cl.created_at DESC
        `;
        const [rows] = await db.execute(sql, [userId]);
        return rows;
    }
}

module.exports = CardLinkModel;
