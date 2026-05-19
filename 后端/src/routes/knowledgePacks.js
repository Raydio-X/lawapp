const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const KnowledgePackModel = require('../models/KnowledgePack');
const FavoriteModel = require('../models/Favorite');
const { auth, adminAuth } = require('../middlewares/auth');

const router = express.Router();

const uploadDir = path.join(__dirname, '../../uploads/knowledge-packs');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'pack-' + uniqueSuffix + ext);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['application/pdf'];
    const allowedExtensions = ['.pdf'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(file.mimetype) && allowedExtensions.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error('只支持PDF格式文件'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024
    }
});

router.get('/', async (req, res) => {
    try {
        const { page, pageSize, category, isFeatured, keyword } = req.query;
        const userId = req.user?.id;
        
        const result = await KnowledgePackModel.getList({
            page: parseInt(page) || 1,
            pageSize: parseInt(pageSize) || 10,
            category,
            isFeatured: isFeatured === 'true' ? true : (isFeatured === 'false' ? false : undefined),
            keyword,
            userId
        });

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('获取知识包列表失败:', error);
        res.status(500).json({ success: false, code: 500, message: '获取知识包列表失败' });
    }
});

router.get('/featured', async (req, res) => {
    try {
        const { limit } = req.query;
        const packs = await KnowledgePackModel.getFeatured(parseInt(limit) || 6);
        
        res.json({
            success: true,
            data: packs
        });
    } catch (error) {
        console.error('获取精选知识包失败:', error);
        res.status(500).json({ success: false, code: 500, message: '获取精选知识包失败' });
    }
});

router.get('/categories', async (req, res) => {
    try {
        const categories = await KnowledgePackModel.getCategories();
        res.json({
            success: true,
            data: categories
        });
    } catch (error) {
        console.error('获取分类列表失败:', error);
        res.status(500).json({ success: false, code: 500, message: '获取分类列表失败' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const userId = req.user?.id;
        const pack = await KnowledgePackModel.findById(req.params.id, userId);
        
        if (!pack) {
            return res.status(404).json({ success: false, code: 404, message: '知识包不存在' });
        }

        await KnowledgePackModel.incrementViewCount(pack.id);

        res.json({
            success: true,
            data: pack
        });
    } catch (error) {
        console.error('获取知识包详情失败:', error);
        res.status(500).json({ success: false, code: 500, message: '获取知识包详情失败' });
    }
});

router.get('/:id/download', async (req, res) => {
    try {
        const pack = await KnowledgePackModel.findById(req.params.id);
        
        if (!pack) {
            return res.status(404).json({ success: false, code: 404, message: '知识包不存在' });
        }

        if (!fs.existsSync(pack.file_path)) {
            return res.status(404).json({ success: false, code: 404, message: '文件不存在' });
        }

        await KnowledgePackModel.incrementDownloadCount(pack.id);

        res.download(pack.file_path, pack.file_name, (err) => {
            if (err) {
                console.error('文件下载失败:', err);
            }
        });
    } catch (error) {
        console.error('下载知识包失败:', error);
        res.status(500).json({ success: false, code: 500, message: '下载知识包失败' });
    }
});

router.get('/:id/preview', async (req, res) => {
    try {
        const pack = await KnowledgePackModel.findById(req.params.id);
        
        if (!pack) {
            return res.status(404).json({ success: false, code: 404, message: '知识包不存在' });
        }

        if (!fs.existsSync(pack.file_path)) {
            return res.status(404).json({ success: false, code: 404, message: '文件不存在' });
        }

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(pack.file_name)}"`);
        
        const fileStream = fs.createReadStream(pack.file_path);
        fileStream.pipe(res);
    } catch (error) {
        console.error('预览知识包失败:', error);
        res.status(500).json({ success: false, code: 500, message: '预览知识包失败' });
    }
});

router.post('/:id/favorite', auth, async (req, res) => {
    try {
        const pack = await KnowledgePackModel.findById(req.params.id);
        if (!pack) {
            return res.status(404).json({ success: false, code: 404, message: '知识包不存在' });
        }

        const result = await FavoriteModel.toggle('knowledge_pack', pack.id, req.user.id);
        
        res.json({
            success: true,
            data: {
                isFavorited: result.isFavorited,
                favoriteCount: result.favoriteCount
            }
        });
    } catch (error) {
        console.error('收藏知识包失败:', error);
        res.status(500).json({ success: false, code: 500, message: '收藏知识包失败' });
    }
});

router.post('/upload', adminAuth, upload.single('file'), async (req, res) => {
    try {
        console.log('Upload request received');
        console.log('req.file:', req.file);
        console.log('req.body:', req.body);
        
        if (!req.file) {
            return res.status(400).json({ success: false, code: 400, message: '请选择要上传的PDF文件' });
        }

        const { title, description, category, tags } = req.body;

        if (!title || title.trim() === '') {
            fs.unlinkSync(req.file.path);
            return res.status(400).json({ success: false, code: 400, message: '知识包标题不能为空' });
        }

        let parsedTags = [];
        if (tags) {
            try {
                parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
            } catch (e) {
                parsedTags = tags.split(',').map(t => t.trim()).filter(t => t);
            }
        }

        const pack = await KnowledgePackModel.create({
            title: title.trim(),
            description: description?.trim() || '',
            file_path: req.file.path,
            file_name: req.file.originalname,
            file_size: req.file.size,
            file_type: req.file.mimetype,
            category: category?.trim() || null,
            tags: parsedTags,
            is_public: 1,
            is_featured: 1,
            created_by: req.user.id
        });

        res.json({
            success: true,
            data: pack,
            message: '知识包上传成功'
        });
    } catch (error) {
        console.error('上传知识包失败:', error);
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ success: false, code: 500, message: '上传知识包失败: ' + error.message });
    }
});

router.put('/:id', adminAuth, async (req, res) => {
    try {
        const pack = await KnowledgePackModel.findById(req.params.id);
        if (!pack) {
            return res.status(404).json({ success: false, code: 404, message: '知识包不存在' });
        }

        const { title, description, category, tags, is_public, is_featured } = req.body;

        let parsedTags;
        if (tags !== undefined) {
            try {
                parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
            } catch (e) {
                parsedTags = tags.split(',').map(t => t.trim()).filter(t => t);
            }
        }

        const updated = await KnowledgePackModel.update(req.params.id, {
            title,
            description,
            category,
            tags: parsedTags,
            is_public: is_public !== undefined ? parseInt(is_public) : undefined,
            is_featured: is_featured !== undefined ? parseInt(is_featured) : undefined
        });

        res.json({
            success: true,
            data: updated,
            message: '知识包更新成功'
        });
    } catch (error) {
        console.error('更新知识包失败:', error);
        res.status(500).json({ success: false, code: 500, message: '更新知识包失败' });
    }
});

router.delete('/:id', adminAuth, async (req, res) => {
    try {
        const pack = await KnowledgePackModel.findById(req.params.id);
        if (!pack) {
            return res.status(404).json({ success: false, code: 404, message: '知识包不存在' });
        }

        const deleted = await KnowledgePackModel.delete(req.params.id);
        
        if (deleted) {
            res.json({
                success: true,
                message: '知识包删除成功'
            });
        } else {
            res.status(500).json({ success: false, code: 500, message: '删除知识包失败' });
        }
    } catch (error) {
        console.error('删除知识包失败:', error);
        res.status(500).json({ success: false, code: 500, message: '删除知识包失败' });
    }
});

router.get('/admin/list', adminAuth, async (req, res) => {
    try {
        const { page, pageSize, keyword, is_public } = req.query;
        
        const result = await KnowledgePackModel.getAdminList({
            page: parseInt(page) || 1,
            pageSize: parseInt(pageSize) || 10,
            keyword,
            is_public
        });

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('获取知识包管理列表失败:', error);
        res.status(500).json({ success: false, code: 500, message: '获取知识包管理列表失败' });
    }
});

module.exports = router;
