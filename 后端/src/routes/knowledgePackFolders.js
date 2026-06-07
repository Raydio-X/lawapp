const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { adminAuth } = require('../middlewares/auth');

/**
 * 获取所有文件夹
 * GET /api/knowledge-pack-folders
 */
router.get('/', async (req, res) => {
    try {
        const [folders] = await db.execute(
            `SELECT f.*, u.nickname as creator_name,
                    (SELECT COUNT(*) FROM knowledge_packs kp WHERE kp.folder_id = f.id) as pack_count
             FROM knowledge_pack_folders f
             LEFT JOIN users u ON f.created_by = u.id
             ORDER BY f.sort_order ASC, f.created_at ASC`
        );

        res.json({
            success: true,
            data: { tree: folders, flat: folders }
        });
    } catch (error) {
        console.error('获取文件夹列表失败:', error);
        res.status(500).json({ success: false, code: 500, message: '获取文件夹列表失败' });
    }
});

/**
 * 获取指定文件夹下的知识包
 * GET /api/knowledge-pack-folders/:id/packs
 */
router.get('/:id/packs', async (req, res) => {
    try {
        const { id } = req.params;
        const folderId = id === 'root' ? null : parseInt(id);

        let sql, values;
        if (folderId === null) {
            sql = `SELECT kp.*, u.nickname as creator_name
                   FROM knowledge_packs kp
                   LEFT JOIN users u ON kp.created_by = u.id
                   WHERE kp.folder_id IS NULL AND kp.is_public = 1
                   ORDER BY kp.created_at DESC`;
            values = [];
        } else {
            sql = `SELECT kp.*, u.nickname as creator_name
                   FROM knowledge_packs kp
                   LEFT JOIN users u ON kp.created_by = u.id
                   WHERE kp.folder_id = ? AND kp.is_public = 1
                   ORDER BY kp.created_at DESC`;
            values = [folderId];
        }

        const [packs] = await db.execute(sql, values);

        res.json({
            success: true,
            data: packs.map(pack => ({
                ...pack,
                tags: typeof pack.tags === 'string' ? JSON.parse(pack.tags) : (pack.tags || [])
            }))
        });
    } catch (error) {
        console.error('获取文件夹知识包失败:', error);
        res.status(500).json({ success: false, code: 500, message: '获取文件夹知识包失败' });
    }
});

/**
 * 创建文件夹
 * POST /api/knowledge-pack-folders
 */
router.post('/', adminAuth, async (req, res) => {
    try {
        const { name, description, sort_order } = req.body;

        if (!name || name.trim() === '') {
            return res.status(400).json({ success: false, code: 400, message: '文件夹名称不能为空' });
        }

        // 检查是否已存在同名文件夹（不允许嵌套，所有文件夹都在根级别）
        const [existing] = await db.execute(
            'SELECT id FROM knowledge_pack_folders WHERE name = ? AND parent_id IS NULL',
            [name.trim()]
        );
        if (existing.length > 0) {
            return res.status(400).json({ success: false, code: 400, message: '已存在同名文件夹' });
        }

        const [result] = await db.execute(
            `INSERT INTO knowledge_pack_folders (name, description, sort_order, created_by)
             VALUES (?, ?, ?, ?)`,
            [name.trim(), description?.trim() || null, sort_order || 0, req.user.id]
        );

        const [newFolder] = await db.execute(
            `SELECT f.*, u.nickname as creator_name FROM knowledge_pack_folders f
             LEFT JOIN users u ON f.created_by = u.id WHERE f.id = ?`,
            [result.insertId]
        );

        res.json({
            success: true,
            data: newFolder[0],
            message: '文件夹创建成功'
        });
    } catch (error) {
        console.error('创建文件夹失败:', error);
        res.status(500).json({ success: false, code: 500, message: '创建文件夹失败' });
    }
});

/**
 * 更新文件夹
 * PUT /api/knowledge-pack-folders/:id
 */
router.put('/:id', adminAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, sort_order } = req.body;

        const [existing] = await db.execute('SELECT id FROM knowledge_pack_folders WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ success: false, code: 404, message: '文件夹不存在' });
        }

        const updates = [];
        const values = [];

        if (name !== undefined) {
            if (name.trim() === '') {
                return res.status(400).json({ success: false, code: 400, message: '文件夹名称不能为空' });
            }
            updates.push('name = ?');
            values.push(name.trim());
        }
        if (description !== undefined) {
            updates.push('description = ?');
            values.push(description?.trim() || null);
        }
        if (sort_order !== undefined) {
            updates.push('sort_order = ?');
            values.push(sort_order);
        }

        if (updates.length === 0) {
            return res.status(400).json({ success: false, code: 400, message: '没有要更新的字段' });
        }

        values.push(id);
        await db.execute(`UPDATE knowledge_pack_folders SET ${updates.join(', ')} WHERE id = ?`, values);

        const [updated] = await db.execute(
            `SELECT f.*, u.nickname as creator_name FROM knowledge_pack_folders f
             LEFT JOIN users u ON f.created_by = u.id WHERE f.id = ?`,
            [id]
        );

        res.json({
            success: true,
            data: updated[0],
            message: '文件夹更新成功'
        });
    } catch (error) {
        console.error('更新文件夹失败:', error);
        res.status(500).json({ success: false, code: 500, message: '更新文件夹失败' });
    }
});

/**
 * 删除文件夹
 * DELETE /api/knowledge-pack-folders/:id
 */
router.delete('/:id', adminAuth, async (req, res) => {
    try {
        const { id } = req.params;

        const [existing] = await db.execute('SELECT id FROM knowledge_pack_folders WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ success: false, code: 404, message: '文件夹不存在' });
        }

        // 将该文件夹下的知识包移至根目录
        await db.execute('UPDATE knowledge_packs SET folder_id = NULL WHERE folder_id = ?', [id]);

        // 将子文件夹移至根目录
        await db.execute('UPDATE knowledge_pack_folders SET parent_id = NULL WHERE parent_id = ?', [id]);

        // 删除文件夹
        await db.execute('DELETE FROM knowledge_pack_folders WHERE id = ?', [id]);

        res.json({
            success: true,
            message: '文件夹删除成功'
        });
    } catch (error) {
        console.error('删除文件夹失败:', error);
        res.status(500).json({ success: false, code: 500, message: '删除文件夹失败' });
    }
});

/**
 * 移动知识包到指定文件夹
 * POST /api/knowledge-pack-folders/move
 */
router.post('/move', adminAuth, async (req, res) => {
    try {
        const { packIds, folderId } = req.body;

        if (!packIds || !Array.isArray(packIds) || packIds.length === 0) {
            return res.status(400).json({ success: false, code: 400, message: '请选择要移动的知识包' });
        }

        const targetFolderId = folderId || null;

        // 如果指定了文件夹，检查文件夹是否存在
        if (targetFolderId) {
            const [folder] = await db.execute('SELECT id FROM knowledge_pack_folders WHERE id = ?', [targetFolderId]);
            if (folder.length === 0) {
                return res.status(404).json({ success: false, code: 404, message: '目标文件夹不存在' });
            }
        }

        const placeholders = packIds.map(() => '?').join(',');
        await db.execute(
            `UPDATE knowledge_packs SET folder_id = ? WHERE id IN (${placeholders})`,
            [targetFolderId, ...packIds]
        );

        res.json({
            success: true,
            message: '知识包移动成功'
        });
    } catch (error) {
        console.error('移动知识包失败:', error);
        res.status(500).json({ success: false, code: 500, message: '移动知识包失败' });
    }
});
module.exports = router;
