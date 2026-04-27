const db = require('../config/database');
const MasteryModel = require('./Mastery');

class StudyModel {
    static async recordStudy(userId, cardId, libraryId, feedback = 'normal', duration = 0) {
        const [result] = await db.execute(
            `INSERT INTO study_records (user_id, card_id, library_id, feedback, study_duration) 
             VALUES (?, ?, ?, ?, ?)`,
            [userId, cardId, libraryId, feedback, duration]
        );
        
        await this.updateCardCount(userId);
        
        return result.insertId;
    }

    static async updateCardCount(userId) {
        const [existing] = await db.execute(
            'SELECT * FROM user_stats WHERE user_id = ?',
            [userId]
        );

        if (existing.length === 0) {
            await db.execute(
                `INSERT INTO user_stats (user_id, total_study_days, current_streak, longest_streak, last_study_date, total_cards_learned) 
                 VALUES (?, 0, 0, 0, NULL, 1)`,
                [userId]
            );
        } else {
            await db.execute(
                `UPDATE user_stats 
                 SET total_cards_learned = (SELECT COUNT(DISTINCT card_id) FROM study_records WHERE user_id = ?)
                 WHERE user_id = ?`,
                [userId, userId]
            );
        }
    }

    static async getStats(userId) {
        const [stats] = await db.execute(
            'SELECT * FROM user_stats WHERE user_id = ?',
            [userId]
        );

        const [user] = await db.execute(
            'SELECT daily_goal FROM users WHERE id = ?',
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

        const toReviewCount = await MasteryModel.getReviewCount(userId);

        return {
            totalCards: totalCards[0].count,
            todayCards: todayTotal,
            streak: stats[0]?.current_streak || 0,
            totalTime: stats[0]?.total_study_time || 0,
            libraryCount: libraries[0].count,
            progress: 0,
            dailyGoal: user[0]?.daily_goal || 50,
            todayNew: todayNew[0]?.count || 0,
            weekTime: currentWeekSeconds,
            weekTrend: weekTrend,
            toReview: toReviewCount
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

    static async getMonthlyStats(userId, year, month) {
        const [timeRows] = await db.execute(
            `SELECT study_date as date, duration
             FROM study_time_records
             WHERE user_id = ? AND YEAR(study_date) = ? AND MONTH(study_date) = ?
             AND study_date < CURDATE()`,
            [userId, year, month]
        );

        const [cardRows] = await db.execute(
            `SELECT DATE(created_at) as date, COUNT(DISTINCT card_id) as count
             FROM study_records
             WHERE user_id = ? AND YEAR(created_at) = ? AND MONTH(created_at) = ?
             AND DATE(created_at) < CURDATE()
             GROUP BY DATE(created_at)`,
            [userId, year, month]
        );

        const stats = {};
        
        timeRows.forEach(row => {
            const dateStr = row.date.toISOString().split('T')[0];
            stats[dateStr] = {
                duration: row.duration || 0,
                cards: 0
            };
        });

        cardRows.forEach(row => {
            const dateStr = row.date.toISOString().split('T')[0];
            if (stats[dateStr]) {
                stats[dateStr].cards = row.count || 0;
            } else {
                stats[dateStr] = {
                    duration: 0,
                    cards: row.count || 0
                };
            }
        });

        return stats;
    }

    static async recordStudyTime(userId, libraryId, duration) {
        const today = new Date().toISOString().split('T')[0];
        
        const [existing] = await db.execute(
            'SELECT * FROM study_time_records WHERE user_id = ? AND study_date = ?',
            [userId, today]
        );

        let newDuration;
        let wasCheckedIn = false;

        if (existing.length === 0) {
            await db.execute(
                `INSERT INTO study_time_records (user_id, library_id, duration, study_date) 
                 VALUES (?, ?, ?, ?)`,
                [userId, libraryId, duration, today]
            );
            newDuration = duration;
        } else {
            newDuration = existing[0].duration + duration;
            await db.execute(
                'UPDATE study_time_records SET duration = ? WHERE user_id = ? AND study_date = ?',
                [newDuration, userId, today]
            );
        }

        const CHECKIN_THRESHOLD = 30 * 60;
        
        if (newDuration >= CHECKIN_THRESHOLD) {
            const [stats] = await db.execute(
                'SELECT last_study_date FROM user_stats WHERE user_id = ?',
                [userId]
            );
            
            const lastStudyDate = stats[0]?.last_study_date;
            const lastStudyDateStr = lastStudyDate ? new Date(lastStudyDate).toISOString().split('T')[0] : null;
            
            if (lastStudyDateStr !== today) {
                wasCheckedIn = true;
                await this.updateCheckIn(userId, today);
            }
        }

        return { inserted: existing.length === 0, duration: newDuration, checkedIn: wasCheckedIn };
    }

    static async updateCheckIn(userId, today) {
        const [existing] = await db.execute(
            'SELECT * FROM user_stats WHERE user_id = ?',
            [userId]
        );

        if (existing.length === 0) {
            await db.execute(
                `INSERT INTO user_stats (user_id, total_study_days, current_streak, longest_streak, last_study_date, total_cards_learned) 
                 VALUES (?, 1, 1, 1, ?, 0)`,
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
                
                if (diffDays === 1) {
                    currentStreak++;
                    totalDays++;
                } else if (diffDays > 1) {
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
                 SET total_study_days = ?, current_streak = ?, longest_streak = ?, last_study_date = ?
                 WHERE user_id = ?`,
                [totalDays, currentStreak, longestStreak, today, userId]
            );
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

    static async getMonthlyAvgStats(year, month) {
        const [timeRows] = await db.execute(
            `SELECT 
                AVG(study_days) as avg_study_days,
                AVG(total_time) as avg_total_time,
                AVG(avg_daily_time) as avg_daily_time,
                AVG(max_daily_time) as avg_max_daily_time
            FROM (
                SELECT 
                    COUNT(*) as study_days,
                    SUM(duration) as total_time,
                    AVG(duration) as avg_daily_time,
                    MAX(duration) as max_daily_time
                FROM study_time_records
                WHERE YEAR(study_date) = ? AND MONTH(study_date) = ?
                AND study_date < CURDATE()
                GROUP BY user_id
            ) as user_stats`,
            [year, month]
        );

        const [cardRows] = await db.execute(
            `SELECT AVG(total_cards) as avg_total_cards
            FROM (
                SELECT COUNT(DISTINCT card_id) as total_cards
                FROM study_records
                WHERE YEAR(created_at) = ? AND MONTH(created_at) = ?
                AND DATE(created_at) < CURDATE()
                GROUP BY user_id
            ) as card_stats`,
            [year, month]
        );

        const timeStats = timeRows[0] || {};
        const cardStats = cardRows[0] || {};
        return {
            avgStudyDays: Math.round(timeStats.avg_study_days || 0),
            avgTotalTime: Math.round((timeStats.avg_total_time || 0) / 60),
            avgDailyTime: Math.round((timeStats.avg_daily_time || 0) / 60),
            avgMaxDailyTime: Math.round((timeStats.avg_max_daily_time || 0) / 60),
            avgTotalCards: Math.round(cardStats.avg_total_cards || 0)
        };
    }
}

module.exports = StudyModel;
