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

        const todayTotal = todayCards[0].count || 0;

        const [todayNew] = await db.execute(
            `SELECT COUNT(DISTINCT sr.card_id) as count FROM study_records sr
             WHERE sr.user_id = ? AND DATE(sr.created_at) = CURDATE()
             AND sr.card_id NOT IN (
                 SELECT DISTINCT card_id FROM study_records 
                 WHERE user_id = ? AND DATE(created_at) < CURDATE()
             )`,
            [userId, userId]
        );

        const [weekTime] = await db.execute(
            `SELECT COALESCE(SUM(duration), 0) as total FROM study_time_records 
             WHERE user_id = ? AND study_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)`,
            [userId]
        );

        const [lastWeekTime] = await db.execute(
            `SELECT COALESCE(SUM(duration), 0) as total FROM study_time_records 
             WHERE user_id = ? AND study_date >= DATE_SUB(CURDATE(), INTERVAL 14 DAY) 
             AND study_date < DATE_SUB(CURDATE(), INTERVAL 7 DAY)`,
            [userId]
        );

        const currentWeekSeconds = weekTime[0]?.total || 0;
        const lastWeekSeconds = lastWeekTime[0]?.total || 0;
        let weekTrend = 0;
        if (lastWeekSeconds > 0) {
            weekTrend = Math.round(((currentWeekSeconds - lastWeekSeconds) / lastWeekSeconds) * 100);
        }

        const [toReview] = await db.execute(
            `SELECT COUNT(DISTINCT sr.card_id) as count FROM study_records sr
             WHERE sr.user_id = ? AND sr.feedback IN ('hard', 'normal')
             AND DATE(sr.created_at) <= DATE_SUB(CURDATE(), INTERVAL 1 DAY)`,
            [userId]
        );

        return {
            totalCards: totalCards[0].count,
            todayCards: todayTotal,
            streak: stats[0]?.current_streak || 0,
            totalTime: stats[0]?.total_study_time || 0,
            libraryCount: libraries[0].count,
            progress: 0,
            dailyGoal: 50,
            todayNew: todayNew[0]?.count || 0,
            weekTime: currentWeekSeconds,
            weekTrend: weekTrend,
            toReview: toReview[0]?.count || 0
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

    static async recordStudyTime(userId, libraryId, duration) {
        const today = new Date().toISOString().split('T')[0];
        
        const [existing] = await db.execute(
            'SELECT * FROM study_time_records WHERE user_id = ? AND study_date = ?',
            [userId, today]
        );

        if (existing.length === 0) {
            const [result] = await db.execute(
                `INSERT INTO study_time_records (user_id, library_id, duration, study_date) 
                 VALUES (?, ?, ?, ?)`,
                [userId, libraryId, duration, today]
            );
            return { inserted: true, duration };
        } else {
            const newDuration = existing[0].duration + duration;
            await db.execute(
                'UPDATE study_time_records SET duration = ? WHERE user_id = ? AND study_date = ?',
                [newDuration, userId, today]
            );
            return { inserted: false, duration: newDuration };
        }
    }

    static async getTodayStudyTime(userId) {
        const today = new Date().toISOString().split('T')[0];
        
        const [rows] = await db.execute(
            'SELECT duration FROM study_time_records WHERE user_id = ? AND study_date = ?',
            [userId, today]
        );

        return {
            todayStudyTime: rows[0]?.duration || 0
        };
    }

    static async getStudyTimeStats(userId) {
        const today = new Date().toISOString().split('T')[0];
        
        const [todayTime] = await db.execute(
            'SELECT COALESCE(SUM(duration), 0) as total FROM study_time_records WHERE user_id = ? AND study_date = ?',
            [userId, today]
        );

        const [totalTime] = await db.execute(
            'SELECT COALESCE(SUM(duration), 0) as total FROM study_time_records WHERE user_id = ?',
            [userId]
        );

        const [weeklyTime] = await db.execute(
            `SELECT COALESCE(SUM(duration), 0) as total FROM study_time_records 
             WHERE user_id = ? AND study_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)`,
            [userId]
        );

        return {
            todayStudyTime: todayTime[0]?.total || 0,
            totalStudyTime: totalTime[0]?.total || 0,
            weeklyStudyTime: weeklyTime[0]?.total || 0
        };
    }
}

module.exports = StudyModel;
