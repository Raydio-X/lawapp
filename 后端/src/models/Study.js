const db = require('../config/database');

class StudyModel {
    static async recordStudy(userId, cardId, libraryId, feedback = 'normal', duration = 0) {
        const [result] = await db.execute(
            `INSERT INTO study_records (user_id, card_id, library_id, feedback, study_duration) 
             VALUES (?, ?, ?, ?, ?)`,
            [userId, cardId, libraryId, feedback, duration]
        );
        
        await this.updateUserStats(userId);
        
        return result.insertId;
    }

    static async updateUserStats(userId) {
        const today = new Date().toISOString().split('T')[0];
        
        const [existing] = await db.execute(
            'SELECT * FROM user_stats WHERE user_id = ?',
            [userId]
        );

        if (existing.length === 0) {
            await db.execute(
                `INSERT INTO user_stats (user_id, total_study_days, current_streak, longest_streak, last_study_date, total_cards_learned) 
                 VALUES (?, 1, 1, 1, ?, 1)`,
                [userId, today]
            );
        } else {
            const stats = existing[0];
            let currentStreak = stats.current_streak;
            let totalDays = stats.total_study_days;
            
            if (stats.last_study_date) {
                const lastDate = new Date(stats.last_study_date);
                const todayDate = new Date(today);
                const diffDays = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));
                
                if (diffDays === 0) {
                    // Same day, no change to streak
                } else if (diffDays === 1) {
                    currentStreak++;
                    totalDays++;
                } else {
                    currentStreak = 1;
                    totalDays++;
                }
            } else {
                currentStreak = 1;
                totalDays = 1;
            }

            const longestStreak = Math.max(stats.longest_streak, currentStreak);
            
            await db.execute(
                `UPDATE user_stats 
                 SET total_study_days = ?, current_streak = ?, longest_streak = ?, last_study_date = ?,
                     total_cards_learned = (SELECT COUNT(DISTINCT card_id) FROM study_records WHERE user_id = ?)
                 WHERE user_id = ?`,
                [totalDays, currentStreak, longestStreak, today, userId, userId]
            );
        }
    }

    static async getStats(userId) {
        const [stats] = await db.execute(
            'SELECT * FROM user_stats WHERE user_id = ?',
            [userId]
        );

        const [todayCards] = await db.execute(
            `SELECT COUNT(*) as count FROM study_records 
             WHERE user_id = ? AND DATE(created_at) = CURDATE()`,
            [userId]
        );

        const [totalCards] = await db.execute(
            'SELECT COUNT(DISTINCT card_id) as count FROM study_records WHERE user_id = ?',
            [userId]
        );

        const [libraries] = await db.execute(
            'SELECT COUNT(*) as count FROM libraries WHERE created_by = ?',
            [userId]
        );

        return {
            totalCards: totalCards[0].count,
            todayCards: todayCards[0].count,
            streak: stats[0]?.current_streak || 0,
            totalTime: stats[0]?.total_study_time || 0,
            libraryCount: libraries[0].count,
            progress: 0
        };
    }

    static async getTodayRecords(userId) {
        const [rows] = await db.execute(
            `SELECT sr.*, c.question, l.name as library_name
             FROM study_records sr
             LEFT JOIN cards c ON sr.card_id = c.id
             LEFT JOIN libraries l ON sr.library_id = l.id
             WHERE sr.user_id = ? AND DATE(sr.created_at) = CURDATE()
             ORDER BY sr.created_at DESC`,
            [userId]
        );
        return rows;
    }

    static async getCalendar(userId, year, month) {
        const [rows] = await db.execute(
            `SELECT DATE(created_at) as date, COUNT(*) as count
             FROM study_records
             WHERE user_id = ? AND YEAR(created_at) = ? AND MONTH(created_at) = ?
             GROUP BY DATE(created_at)`,
            [userId, year, month]
        );
        return rows;
    }

    static async getLibraryProgress(userId, libraryId) {
        const [totalCards] = await db.execute(
            'SELECT COUNT(*) as count FROM cards WHERE library_id = ?',
            [libraryId]
        );

        const [learnedCards] = await db.execute(
            `SELECT COUNT(DISTINCT sr.card_id) as count 
             FROM study_records sr
             LEFT JOIN cards c ON sr.card_id = c.id
             WHERE sr.user_id = ? AND c.library_id = ?`,
            [userId, libraryId]
        );

        const total = totalCards[0].count;
        const learned = learnedCards[0].count;

        return {
            totalCards: total,
            learnedCards: learned,
            progress: total > 0 ? Math.round((learned / total) * 100) : 0
        };
    }

    static async getRecentCards(userId, limit = 10) {
        const [rows] = await db.execute(
            `SELECT c.*, l.name as library_name, sr.created_at as last_study_time
             FROM study_records sr
             LEFT JOIN cards c ON sr.card_id = c.id
             LEFT JOIN libraries l ON c.library_id = l.id
             WHERE sr.user_id = ?
             GROUP BY sr.card_id
             ORDER BY MAX(sr.created_at) DESC
             LIMIT ${parseInt(limit)}`,
            [userId]
        );
        return rows.map(row => ({
            ...row,
            tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : (row.tags || [])
        }));
    }

    static async getTrend(userId, days = 7) {
        const [rows] = await db.execute(
            `SELECT DATE(created_at) as date, COUNT(*) as count
             FROM study_records
             WHERE user_id = ? AND created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
             GROUP BY DATE(created_at)
             ORDER BY date ASC`,
            [userId, parseInt(days)]
        );
        return rows;
    }

    static async getHeatmap(userId, year) {
        const [rows] = await db.execute(
            `SELECT DATE(created_at) as date, COUNT(*) as count
             FROM study_records
             WHERE user_id = ? AND YEAR(created_at) = ?
             GROUP BY DATE(created_at)`,
            [userId, year || new Date().getFullYear()]
        );
        return rows;
    }
}

module.exports = StudyModel;
