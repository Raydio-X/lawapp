const db = require('../config/database');
const UserIdGenerator = require('../utils/userIdGenerator');

class UserModel {
    static async findByOpenid(openid) {
        const [rows] = await db.execute(
            'SELECT * FROM users WHERE openid = ?',
            [openid]
        );
        return rows[0];
    }

    static async findById(id) {
        const [rows] = await db.execute(
            'SELECT * FROM users WHERE id = ?',
            [id]
        );
        return rows[0];
    }

    static async findByNickname(nickname) {
        const [rows] = await db.execute(
            'SELECT * FROM users WHERE nickname = ?',
            [nickname]
        );
        return rows[0];
    }

    static async findByUserId(userId) {
        const [rows] = await db.execute(
            'SELECT * FROM users WHERE user_id = ?',
            [userId]
        );
        return rows[0];
    }

    static async create(data) {
        const userId = await UserIdGenerator.generateUniqueId();
        const [result] = await db.execute(
            'INSERT INTO users (user_id, openid, nickname, avatar, bio, phone, gender) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [userId, data.openid, data.nickname || '微信用户', data.avatar || '', data.bio || '', data.phone || '', data.gender || 0]
        );
        return this.findById(result.insertId);
    }

    static async update(id, data) {
        const fields = [];
        const values = [];
        
        if (data.nickname !== undefined) {
            fields.push('nickname = ?');
            values.push(data.nickname);
            fields.push('nickname_updated_at = NOW()');
        }
        if (data.avatar !== undefined) {
            fields.push('avatar = ?');
            values.push(data.avatar);
        }
        if (data.bio !== undefined) {
            fields.push('bio = ?');
            values.push(data.bio);
        }
        if (data.phone !== undefined) {
            fields.push('phone = ?');
            values.push(data.phone);
        }
        if (data.gender !== undefined) {
            fields.push('gender = ?');
            values.push(data.gender);
        }
        if (data.daily_goal !== undefined) {
            fields.push('daily_goal = ?');
            values.push(data.daily_goal);
        }

        if (fields.length === 0) return this.findById(id);

        values.push(id);
        await db.execute(
            `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
            values
        );
        return this.findById(id);
    }

    static async canUpdateNickname(userId) {
        const user = await this.findById(userId);
        if (!user) {
            return { canUpdate: false, remainingDays: 0 };
        }

        if (!user.nickname_updated_at) {
            return { canUpdate: true, remainingDays: 0 };
        }

        const lastUpdateTime = new Date(user.nickname_updated_at);
        const now = new Date();
        const daysPassed = Math.floor((now.getTime() - lastUpdateTime.getTime()) / (1000 * 60 * 60 * 24));

        if (daysPassed >= 30) {
            return { canUpdate: true, remainingDays: 0 };
        }

        return { canUpdate: false, remainingDays: 30 - daysPassed };
    }

    static async updateDailyGoal(userId, dailyGoal) {
        await db.execute(
            'UPDATE users SET daily_goal = ? WHERE id = ?',
            [dailyGoal, userId]
        );
        return this.findById(userId);
    }

    static async getStats(userId) {
        const [libraries] = await db.execute(
            'SELECT COUNT(*) as count FROM libraries WHERE created_by = ?',
            [userId]
        );
        
        const [cards] = await db.execute(
            'SELECT COUNT(*) as count FROM cards WHERE created_by = ?',
            [userId]
        );
        
        const [favorites] = await db.execute(
            'SELECT COUNT(*) as count FROM favorites WHERE user_id = ?',
            [userId]
        );
        
        const [wrongCards] = await db.execute(
            'SELECT COUNT(*) as count FROM wrong_cards WHERE user_id = ?',
            [userId]
        );

        return {
            libraryCount: libraries[0].count,
            cardCount: cards[0].count,
            favoriteCount: favorites[0].count,
            wrongCount: wrongCards[0].count
        };
    }

    static async activateVIP(userId, durationDays) {
        const user = await this.findById(userId);
        if (!user) {
            throw new Error('用户不存在');
        }

        let expiresAt;
        if (durationDays === -1) {
            expiresAt = null;
        } else {
            const now = new Date();
            let baseDate;
            if (user.vip_expires_at && new Date(user.vip_expires_at) > now) {
                baseDate = new Date(user.vip_expires_at);
            } else {
                baseDate = now;
            }
            expiresAt = new Date(baseDate.getTime() + durationDays * 24 * 60 * 60 * 1000);
            expiresAt.setHours(23, 59, 59, 999);
        }

        await db.execute(
            'UPDATE users SET is_vip = 1, vip_expires_at = ? WHERE id = ?',
            [expiresAt, userId]
        );
        return this.findById(userId);
    }

    static async checkVIPStatus(userId) {
        const user = await this.findById(userId);
        if (!user) return false;

        if (!user.is_vip) return false;

        if (user.vip_expires_at && new Date(user.vip_expires_at) < new Date()) {
            await db.execute(
                'UPDATE users SET is_vip = 0 WHERE id = ?',
                [userId]
            );
            return false;
        }

        return true;
    }
}

module.exports = UserModel;
