const express = require('express');
const router = express.Router();
const db = require('../config/database');
const path = require('path');
const fs = require('fs');

// download目录路径
const downloadDir = path.join(__dirname, '../../download');

/**
 * 版本号比较函数
 * @param {string} v1 - 版本号1，如 "1.2.3"
 * @param {string} v2 - 版本号2，如 "1.2.4"
 * @returns {number} - v1 < v2 返回 -1，v1 = v2 返回 0，v1 > v2 返回 1
 */
function compareVersions(v1, v2) {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);
    
    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
        const p1 = parts1[i] || 0;
        const p2 = parts2[i] || 0;
        
        if (p1 < p2) return -1;
        if (p1 > p2) return 1;
    }
    
    return 0;
}

/**
 * 判断是否为大版本更新（主版本号变化）
 * @param {string} currentVersion - 当前版本
 * @param {string} latestVersion - 最新版本
 * @returns {boolean}
 */
function isMajorUpdate(currentVersion, latestVersion) {
    const currentMajor = parseInt(currentVersion.split('.')[0], 10);
    const latestMajor = parseInt(latestVersion.split('.')[0], 10);
    return latestMajor > currentMajor;
}

/**
 * 获取最新版本信息
 * GET /api/version/latest
 */
router.get('/latest', async (req, res) => {
    try {
        const platform = req.query.platform || 'android';
        
        // 获取最新版本信息
        const [versions] = await db.execute(
            `SELECT 
                id, 
                version_code, 
                version_name, 
                platform, 
                download_url, 
                force_update, 
                update_log, 
                created_at 
            FROM app_versions 
            WHERE platform = ? AND is_active = 1 
            ORDER BY version_code DESC 
            LIMIT 1`,
            [platform]
        );
        
        if (versions.length === 0) {
            return res.json({
                success: true,
                data: null,
                message: '暂无版本信息'
            });
        }
        
        const latestVersion = versions[0];
        
        res.json({
            success: true,
            data: {
                versionCode: latestVersion.version_code,
                versionName: latestVersion.version_name,
                platform: latestVersion.platform,
                downloadUrl: latestVersion.download_url,
                forceUpdate: !!latestVersion.force_update,
                updateLog: latestVersion.update_log || '',
                releaseDate: latestVersion.created_at
            }
        });
    } catch (error) {
        console.error('获取版本信息失败:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '获取版本信息失败'
        });
    }
});

/**
 * 检查版本更新
 * POST /api/version/check
 * Body: { currentVersion: "1.0.0", platform: "android" }
 */
router.post('/check', async (req, res) => {
    try {
        const { currentVersion, platform = 'android' } = req.body;
        
        if (!currentVersion) {
            return res.status(400).json({
                success: false,
                code: 400,
                message: '缺少当前版本号'
            });
        }
        
        // 获取最新版本信息
        const [versions] = await db.execute(
            `SELECT 
                id, 
                version_code, 
                version_name, 
                platform, 
                download_url, 
                force_update, 
                update_log, 
                force_update_versions,
                created_at 
            FROM app_versions 
            WHERE platform = ? AND is_active = 1 
            ORDER BY version_code DESC 
            LIMIT 1`,
            [platform]
        );
        
        if (versions.length === 0) {
            return res.json({
                success: true,
                data: {
                    needUpdate: false,
                    currentVersion,
                    latestVersion: null
                }
            });
        }
        
        const latestVersion = versions[0];
        const comparison = compareVersions(currentVersion, latestVersion.version_name);
        
        // 当前版本已是最新
        if (comparison >= 0) {
            return res.json({
                success: true,
                data: {
                    needUpdate: false,
                    currentVersion,
                    latestVersion: {
                        versionCode: latestVersion.version_code,
                        versionName: latestVersion.version_name
                    }
                }
            });
        }
        
        // 需要更新
        let isForceUpdate = false;
        
        // 方式1：数据库标记强制更新
        if (latestVersion.force_update) {
            isForceUpdate = true;
        }
        
        // 方式2：主版本号变化（大版本更新）
        if (isMajorUpdate(currentVersion, latestVersion.version_name)) {
            isForceUpdate = true;
        }
        
        // 方式3：当前版本在强制更新版本列表中
        if (latestVersion.force_update_versions) {
            try {
                const forceVersions = JSON.parse(latestVersion.force_update_versions);
                if (Array.isArray(forceVersions) && forceVersions.includes(currentVersion)) {
                    isForceUpdate = true;
                }
            } catch (e) {
                console.error('解析强制更新版本列表失败:', e);
            }
        }
        
        res.json({
            success: true,
            data: {
                needUpdate: true,
                currentVersion,
                latestVersion: {
                    versionCode: latestVersion.version_code,
                    versionName: latestVersion.version_name,
                    platform: latestVersion.platform,
                    downloadUrl: latestVersion.download_url,
                    forceUpdate: isForceUpdate,
                    updateLog: latestVersion.update_log || '',
                    releaseDate: latestVersion.created_at
                }
            }
        });
    } catch (error) {
        console.error('检查版本更新失败:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '检查版本更新失败'
        });
    }
});

/**
 * 管理员接口：创建新版本
 * POST /api/version/create
 */
router.post('/create', async (req, res) => {
    try {
        const { 
            versionCode, 
            versionName, 
            platform = 'android', 
            downloadUrl, 
            forceUpdate = false, 
            updateLog = '',
            forceUpdateVersions = []
        } = req.body;
        
        if (!versionCode || !versionName || !downloadUrl) {
            return res.status(400).json({
                success: false,
                code: 400,
                message: '缺少必要参数'
            });
        }
        
        await db.execute(
            `INSERT INTO app_versions 
            (version_code, version_name, platform, download_url, force_update, update_log, force_update_versions, is_active, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, 1, NOW())`,
            [
                versionCode, 
                versionName, 
                platform, 
                downloadUrl, 
                forceUpdate ? 1 : 0, 
                updateLog,
                JSON.stringify(forceUpdateVersions)
            ]
        );
        
        res.json({
            success: true,
            message: '版本创建成功'
        });
    } catch (error) {
        console.error('创建版本失败:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '创建版本失败'
        });
    }
});

/**
 * 管理员接口：获取所有版本列表
 * GET /api/version/list
 */
router.get('/list', async (req, res) => {
    try {
        const platform = req.query.platform || 'android';
        
        const [versions] = await db.execute(
            `SELECT 
                id, 
                version_code, 
                version_name, 
                platform, 
                download_url, 
                force_update, 
                update_log, 
                force_update_versions,
                is_active,
                created_at 
            FROM app_versions 
            WHERE platform = ? 
            ORDER BY version_code DESC`,
            [platform]
        );
        
        res.json({
            success: true,
            data: versions
        });
    } catch (error) {
        console.error('获取版本列表失败:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '获取版本列表失败'
        });
    }
});

/**
 * 获取已放置的APK文件列表
 * GET /api/version/apk-files
 */
router.get('/apk-files', (req, res) => {
    try {
        // 检查目录是否存在
        if (!fs.existsSync(downloadDir)) {
            return res.json({
                success: true,
                data: []
            });
        }

        const files = fs.readdirSync(downloadDir)
            .filter(file => path.extname(file).toLowerCase() === '.apk')
            .map(file => {
                const filePath = path.join(downloadDir, file);
                const stats = fs.statSync(filePath);
                return {
                    filename: file,
                    size: stats.size,
                    uploadTime: stats.mtime,
                    downloadUrl: `https://www.lawapp.top/download/${file}`
                };
            })
            .sort((a, b) => b.uploadTime - a.uploadTime);

        res.json({
            success: true,
            data: files
        });
    } catch (error) {
        console.error('获取APK文件列表失败:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '获取APK文件列表失败'
        });
    }
});

/**
 * 管理员接口：更新版本信息
 * PUT /api/version/:id
 */
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            downloadUrl, 
            forceUpdate, 
            updateLog, 
            forceUpdateVersions,
            isActive 
        } = req.body;
        
        const updates = [];
        const values = [];
        
        if (downloadUrl !== undefined) {
            updates.push('download_url = ?');
            values.push(downloadUrl);
        }
        if (forceUpdate !== undefined) {
            updates.push('force_update = ?');
            values.push(forceUpdate ? 1 : 0);
        }
        if (updateLog !== undefined) {
            updates.push('update_log = ?');
            values.push(updateLog);
        }
        if (forceUpdateVersions !== undefined) {
            updates.push('force_update_versions = ?');
            values.push(JSON.stringify(forceUpdateVersions));
        }
        if (isActive !== undefined) {
            updates.push('is_active = ?');
            values.push(isActive ? 1 : 0);
        }
        
        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                code: 400,
                message: '没有要更新的字段'
            });
        }
        
        values.push(id);
        
        await db.execute(
            `UPDATE app_versions SET ${updates.join(', ')} WHERE id = ?`,
            values
        );
        
        res.json({
            success: true,
            message: '版本更新成功'
        });
    } catch (error) {
        console.error('更新版本失败:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '更新版本失败'
        });
    }
});

/**
 * 管理员接口：删除版本
 * DELETE /api/version/:id
 */
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        await db.execute('DELETE FROM app_versions WHERE id = ?', [id]);
        
        res.json({
            success: true,
            message: '版本删除成功'
        });
    } catch (error) {
        console.error('删除版本失败:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '删除版本失败'
        });
    }
});

module.exports = router;
