const db = require('../config/database');

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

    static async create(data) {
        const [result] = await db.execute(
            'INSERT INTO users (openid, nickname, avatar, bio, phone, gender) VALUES (?, ?, ?, ?, ?, ?)',
            [data.openid, data.nickname || '微信用户', data.avatar || '', data.bio || '', data.phone || '', data.gender || 0]
        );
        return this.findById(result.insertId);
    }

    static async update(id, data) {
        const fields = [];
        const values = [];
        
        if (data.nickname !== undefined) {
            fields.push('nickname = ?');
            values.push(data.nickname);
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
}

module.exports = UserModel;
