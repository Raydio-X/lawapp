const db = require('../config/database');

class UserIdGenerator {
    static PREFIX = 'LK';

    static generateRandomId() {
        const chars = '0123456789';
        let randomPart = '';
        for (let i = 0; i < 6; i++) {
            randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return `${this.PREFIX}${randomPart}`;
    }

    static async isUniqueId(userId) {
        const [rows] = await db.execute(
            'SELECT id FROM users WHERE user_id = ?',
            [userId]
        );
        return rows.length === 0;
    }

    static async generateUniqueId(maxAttempts = 20) {
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const userId = this.generateRandomId();
            if (await this.isUniqueId(userId)) {
                return userId;
            }
        }

        const timestamp = Date.now().toString().slice(-10);
        const fallbackId = `${this.PREFIX}${timestamp}`;
        
        if (await this.isUniqueId(fallbackId)) {
            return fallbackId;
        }

        throw new Error('无法生成唯一用户ID');
    }
}

module.exports = UserIdGenerator;
