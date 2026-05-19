const db = require('../config/database');
const path = require('path');
const fs = require('fs').promises;

class KnowledgePackModel {
    static async getList(params = {}) {
        const { page = 1, pageSize = 10, category, isFeatured, keyword, userId } = params;
        const offset = (page - 1) * pageSize;

        let sql = `SELECT kp.*, u.nickname as creator_name,
                   (SELECT COUNT(*) FROM favorites f WHERE f.target_type = 'knowledge_pack' AND f.target_id = kp.id) as favorite_count,
                   (SELECT COUNT(*) FROM favorites f WHERE f.target_type = 'knowledge_pack' AND f.target_id = kp.id AND f.user_id = ?) as is_favorited
                   FROM knowledge_packs kp 
                   LEFT JOIN users u ON kp.created_by = u.id 
                   WHERE kp.is_public = 1`;
        const values = [userId || 0];

        if (category) {
            sql += ' AND kp.category = ?';
            values.push(category);
        }

        if (isFeatured !== undefined) {
            sql += ' AND kp.is_featured = ?';
            values.push(isFeatured ? 1 : 0);
        }

        if (keyword) {
            sql += ' AND (kp.title LIKE ? OR kp.description LIKE ?)';
            values.push(`%${keyword}%`, `%${keyword}%`);
        }

        sql += ` ORDER BY kp.is_featured DESC, kp.created_at DESC LIMIT ${parseInt(pageSize)} OFFSET ${offset}`;

        const [rows] = await db.execute(sql, values);

        let countSql = 'SELECT COUNT(*) as total FROM knowledge_packs WHERE is_public = 1';
        const countValues = [];
        if (category) {
            countSql += ' AND category = ?';
            countValues.push(category);
        }
        if (isFeatured !== undefined) {
            countSql += ' AND is_featured = ?';
            countValues.push(isFeatured ? 1 : 0);
        }
        if (keyword) {
            countSql += ' AND (title LIKE ? OR description LIKE ?)';
            countValues.push(`%${keyword}%`, `%${keyword}%`);
        }
        const [countRows] = await db.execute(countSql, countValues);

        return {
            list: rows.map(row => ({
                ...row,
                tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : (row.tags || []),
                is_favorited: row.is_favorited > 0,
                file_size_formatted: this.formatFileSize(row.file_size)
            })),
            pagination: {
                page: parseInt(page),
                pageSize: parseInt(pageSize),
                total: countRows[0].total,
                totalPages: Math.ceil(countRows[0].total / pageSize)
            }
        };
    }

    static async getFeatured(limit = 6) {
        const limitNum = parseInt(limit) || 6;
        const [rows] = await db.execute(
            `SELECT kp.*, u.nickname as creator_name
             FROM knowledge_packs kp 
             LEFT JOIN users u ON kp.created_by = u.id 
             WHERE kp.is_public = 1
             ORDER BY kp.created_at DESC 
             LIMIT ${limitNum}`
        );

        return rows.map(row => ({
            ...row,
            tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : (row.tags || []),
            file_size_formatted: this.formatFileSize(row.file_size)
        }));
    }

    static async findById(id, userId = null) {
        let sql = `SELECT kp.*, u.nickname as creator_name,
                   (SELECT COUNT(*) FROM favorites f WHERE f.target_type = 'knowledge_pack' AND f.target_id = kp.id) as favorite_count,
                   (SELECT COUNT(*) FROM favorites f WHERE f.target_type = 'knowledge_pack' AND f.target_id = kp.id AND f.user_id = ?) as is_favorited
                   FROM knowledge_packs kp 
                   LEFT JOIN users u ON kp.created_by = u.id 
                   WHERE kp.id = ?`;
        
        const [rows] = await db.execute(sql, [userId || 0, id]);
        
        if (rows.length === 0) {
            return null;
        }

        const row = rows[0];
        return {
            ...row,
            tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : (row.tags || []),
            is_favorited: row.is_favorited > 0,
            file_size_formatted: this.formatFileSize(row.file_size)
        };
    }

    static async create(data) {
        const { title, description, file_path, file_name, file_size, file_type, cover_image, category, tags, is_public, is_featured, created_by } = data;
        
        const [result] = await db.execute(
            `INSERT INTO knowledge_packs (title, description, file_path, file_name, file_size, file_type, cover_image, category, tags, is_public, is_featured, created_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                title, 
                description || null, 
                file_path, 
                file_name, 
                file_size, 
                file_type || 'application/pdf', 
                cover_image || null, 
                category || null, 
                JSON.stringify(tags || []), 
                is_public ?? 1, 
                is_featured ?? 0, 
                created_by
            ]
        );

        return this.findById(result.insertId);
    }

    static async update(id, data) {
        const fields = [];
        const values = [];

        const allowedFields = ['title', 'description', 'cover_image', 'category', 'tags', 'is_public', 'is_featured'];
        
        for (const field of allowedFields) {
            if (data[field] !== undefined) {
                fields.push(`${field} = ?`);
                if (field === 'tags') {
                    values.push(JSON.stringify(data[field] || []));
                } else if (field === 'description' || field === 'cover_image' || field === 'category') {
                    values.push(data[field] || null);
                } else {
                    values.push(data[field]);
                }
            }
        }

        if (fields.length === 0) {
            return this.findById(id);
        }

        values.push(id);
        await db.execute(`UPDATE knowledge_packs SET ${fields.join(', ')} WHERE id = ?`, values);

        return this.findById(id);
    }

    static async delete(id) {
        const pack = await this.findById(id);
        if (!pack) {
            return false;
        }

        if (pack.file_path) {
            try {
                await fs.unlink(pack.file_path);
            } catch (error) {
                console.error('删除文件失败:', error);
            }
        }

        if (pack.cover_image) {
            try {
                await fs.unlink(pack.cover_image);
            } catch (error) {
                console.error('删除封面图片失败:', error);
            }
        }

        await db.execute('DELETE FROM knowledge_packs WHERE id = ?', [id]);
        return true;
    }

    static async incrementDownloadCount(id) {
        await db.execute('UPDATE knowledge_packs SET download_count = download_count + 1 WHERE id = ?', [id]);
    }

    static async incrementViewCount(id) {
        await db.execute('UPDATE knowledge_packs SET view_count = view_count + 1 WHERE id = ?', [id]);
    }

    static async getCategories() {
        const [rows] = await db.execute(
            'SELECT DISTINCT category FROM knowledge_packs WHERE category IS NOT NULL AND is_public = 1 ORDER BY category'
        );
        return rows.map(row => row.category);
    }

    static formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    static async getAdminList(params = {}) {
        const { page = 1, pageSize = 10, keyword, is_public } = params;
        const offset = (page - 1) * pageSize;

        let sql = `SELECT kp.*, u.nickname as creator_name
                   FROM knowledge_packs kp 
                   LEFT JOIN users u ON kp.created_by = u.id 
                   WHERE 1=1`;
        const values = [];

        if (keyword) {
            sql += ' AND (kp.title LIKE ? OR kp.description LIKE ?)';
            values.push(`%${keyword}%`, `%${keyword}%`);
        }

        if (is_public !== undefined && is_public !== '') {
            sql += ' AND kp.is_public = ?';
            values.push(parseInt(is_public));
        }

        let countSql = 'SELECT COUNT(*) as total FROM knowledge_packs WHERE 1=1';
        const countValues = [];
        if (keyword) {
            countSql += ' AND (title LIKE ? OR description LIKE ?)';
            countValues.push(`%${keyword}%`, `%${keyword}%`);
        }
        if (is_public !== undefined && is_public !== '') {
            countSql += ' AND is_public = ?';
            countValues.push(parseInt(is_public));
        }

        const [countRows] = await db.execute(countSql, countValues);

        sql += ` ORDER BY kp.created_at DESC LIMIT ${parseInt(pageSize)} OFFSET ${offset}`;
        const [rows] = await db.execute(sql, values);

        return {
            list: rows.map(row => ({
                ...row,
                tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : (row.tags || []),
                file_size_formatted: this.formatFileSize(row.file_size)
            })),
            pagination: {
                page: parseInt(page),
                pageSize: parseInt(pageSize),
                total: countRows[0].total,
                totalPages: Math.ceil(countRows[0].total / pageSize)
            }
        };
    }
}

module.exports = KnowledgePackModel;
