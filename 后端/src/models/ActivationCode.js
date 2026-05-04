const db = require('../config/database');

class ActivationCodeModel {
    static async create(data) {
        const [result] = await db.execute(
            'INSERT INTO activation_codes (code, duration_days, created_by) VALUES (?, ?, ?)',
            [data.code, data.duration_days, data.created_by]
        );
        return this.findById(result.insertId);
    }

    static async findById(id) {
        const [rows] = await db.execute(
            `SELECT ac.*, u.nickname as used_by_name 
             FROM activation_codes ac 
             LEFT JOIN users u ON ac.used_by = u.id 
             WHERE ac.id = ?`,
            [id]
        );
        return rows[0];
    }

    static async findByCode(code) {
        const [rows] = await db.execute(
            'SELECT * FROM activation_codes WHERE code = ?',
            [code]
        );
        return rows[0];
    }

    static async batchCreate(codes, durationDays, createdBy) {
        const values = codes.map(code => [code, durationDays, createdBy]);
        const placeholders = values.map(() => '(?, ?, ?)').join(', ');
        const flatValues = values.flat();
        
        await db.execute(
            `INSERT INTO activation_codes (code, duration_days, created_by) VALUES ${placeholders}`,
            flatValues
        );
        
        return codes.length;
    }

    static async getList(params = {}) {
        const { page = 1, pageSize = 20, isUsed } = params;
        const offset = (parseInt(page) - 1) * parseInt(pageSize);
        const limit = parseInt(pageSize);

        let sql = `SELECT ac.*, u.nickname as used_by_name 
                   FROM activation_codes ac 
                   LEFT JOIN users u ON ac.used_by = u.id 
                   WHERE 1=1`;
        const values = [];

        if (isUsed !== undefined && isUsed !== '') {
            sql += ' AND ac.is_used = ?';
            values.push(parseInt(isUsed));
        }

        sql += ` ORDER BY ac.created_at DESC LIMIT ${limit} OFFSET ${offset}`;

        const [rows] = await db.execute(sql, values);

        let countSql = 'SELECT COUNT(*) as total FROM activation_codes WHERE 1=1';
        const countValues = [];
        if (isUsed !== undefined && isUsed !== '') {
            countSql += ' AND is_used = ?';
            countValues.push(parseInt(isUsed));
        }

        const [countResult] = await db.execute(countSql, countValues);
        const total = countResult[0].total;

        return {
            list: rows,
            total,
            hasMore: offset + rows.length < total
        };
    }

    static async useCode(code, userId) {
        const codeData = await this.findByCode(code);
        
        if (!codeData) {
            throw new Error('激活码不存在');
        }
        
        if (codeData.is_used) {
            throw new Error('激活码已被使用');
        }

        await db.execute(
            'UPDATE activation_codes SET is_used = 1, used_by = ?, used_at = NOW() WHERE id = ?',
            [userId, codeData.id]
        );

        return codeData;
    }

    static async delete(id) {
        const [result] = await db.execute(
            'DELETE FROM activation_codes WHERE id = ? AND is_used = 0',
            [id]
        );
        return result.affectedRows > 0;
    }
}

module.exports = ActivationCodeModel;
