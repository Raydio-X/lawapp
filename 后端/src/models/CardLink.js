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

    // 获取用户所有卡片关联数据（用于脑图展示）
    static async getAllLinkedCardsForMindMap(userId) {
        const sql = `
            SELECT 
                cl.card_id,
                cl.linked_card_id,
                c1.question as card_question,
                c1.answer as card_answer,
                c1.tags as card_tags,
                l1.name as card_library_name,
                c2.question as linked_card_question,
                c2.answer as linked_card_answer,
                c2.tags as linked_card_tags,
                l2.name as linked_library_name
            FROM card_links cl
            JOIN cards c1 ON cl.card_id = c1.id
            JOIN cards c2 ON cl.linked_card_id = c2.id
            LEFT JOIN libraries l1 ON c1.library_id = l1.id
            LEFT JOIN libraries l2 ON c2.library_id = l2.id
            WHERE cl.user_id = ?
            ORDER BY cl.created_at DESC
        `;
        const [rows] = await db.execute(sql, [userId]);
        return rows.map(row => ({
            ...row,
            card_tags: typeof row.card_tags === 'string' ? JSON.parse(row.card_tags) : (row.card_tags || []),
            linked_card_tags: typeof row.linked_card_tags === 'string' ? JSON.parse(row.linked_card_tags) : (row.linked_card_tags || [])
        }));
    }
}

module.exports = CardLinkModel;
