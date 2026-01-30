"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const resource_1 = require("../models/resource");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const config_1 = require("../config");
const archiver_1 = __importDefault(require("archiver"));
const router = (0, express_1.Router)();
// 配置文件上传
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => {
        const uploadDir = config_1.config.getAbsolutePath(config_1.config.storage.uploadDir);
        if (!fs_1.default.existsSync(uploadDir)) {
            fs_1.default.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (_req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path_1.default.extname(file.originalname));
    }
});
const upload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB
    }
});
// 转换数据库字段为前端格式
function formatResource(r) {
    return {
        id: r.id,
        type: r.type,
        subtype: r.subtype,
        filePath: r.file_path,
        fileSize: r.file_size,
        mimeType: r.mime_type,
        storyboardId: r.storyboard_id,
        projectId: r.project_id,
        metadata: r.metadata ? JSON.parse(r.metadata) : undefined,
        createdAt: r.created_at
    };
}
// 获取资源列表
router.get('/', (req, res) => {
    try {
        const { projectId, storyboardId, type } = req.query;
        const resources = resource_1.resourceModel.findAll({
            projectId: projectId,
            storyboardId: storyboardId,
            type: type
        });
        res.json({
            resources: resources.map(formatResource)
        });
    }
    catch (error) {
        console.error('Error fetching resources:', error);
        res.status(500).json({ message: '获取资源列表失败' });
    }
});
// 上传资源
router.post('/upload', upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: '没有上传文件' });
        }
        const { type, storyboardId, projectId } = req.body;
        if (!type) {
            return res.status(400).json({ message: '资源类型不能为空' });
        }
        const resource = resource_1.resourceModel.create({
            type,
            file_path: req.file.filename,
            file_size: req.file.size,
            mime_type: req.file.mimetype,
            storyboard_id: storyboardId,
            project_id: projectId
        });
        res.status(201).json({
            resource: formatResource(resource)
        });
    }
    catch (error) {
        console.error('Error uploading resource:', error);
        res.status(500).json({ message: '上传资源失败' });
    }
});
// 下载资源
router.get('/:id/download', (req, res) => {
    try {
        const resource = resource_1.resourceModel.findById(req.params.id);
        if (!resource) {
            return res.status(404).json({ message: '资源不存在' });
        }
        const filePath = path_1.default.join(config_1.config.getAbsolutePath(config_1.config.storage.generatedDir), resource.file_path);
        if (!fs_1.default.existsSync(filePath)) {
            // 尝试从uploads目录查找
            const uploadPath = path_1.default.join(config_1.config.getAbsolutePath(config_1.config.storage.uploadDir), resource.file_path);
            if (fs_1.default.existsSync(uploadPath)) {
                return res.download(uploadPath);
            }
            return res.status(404).json({ message: '文件不存在' });
        }
        res.download(filePath);
    }
    catch (error) {
        console.error('Error downloading resource:', error);
        res.status(500).json({ message: '下载资源失败' });
    }
});
// 删除资源
router.delete('/:id', (req, res) => {
    try {
        const resource = resource_1.resourceModel.findById(req.params.id);
        if (!resource) {
            return res.status(404).json({ message: '资源不存在' });
        }
        // 删除物理文件
        const filePath = path_1.default.join(config_1.config.getAbsolutePath(config_1.config.storage.generatedDir), resource.file_path);
        if (fs_1.default.existsSync(filePath)) {
            fs_1.default.unlinkSync(filePath);
        }
        const uploadPath = path_1.default.join(config_1.config.getAbsolutePath(config_1.config.storage.uploadDir), resource.file_path);
        if (fs_1.default.existsSync(uploadPath)) {
            fs_1.default.unlinkSync(uploadPath);
        }
        // 删除数据库记录
        const success = resource_1.resourceModel.delete(req.params.id);
        res.json({ success });
    }
    catch (error) {
        console.error('Error deleting resource:', error);
        res.status(500).json({ message: '删除资源失败' });
    }
});
// 批量下载
router.post('/batch-download', async (req, res) => {
    try {
        const { resourceIds } = req.body;
        if (!Array.isArray(resourceIds) || resourceIds.length === 0) {
            return res.status(400).json({ message: 'resourceIds必须是非空数组' });
        }
        const archive = (0, archiver_1.default)('zip', { zlib: { level: 9 } });
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', 'attachment; filename=resources.zip');
        archive.pipe(res);
        for (const id of resourceIds) {
            const resource = resource_1.resourceModel.findById(id);
            if (resource) {
                const filePath = path_1.default.join(config_1.config.getAbsolutePath(config_1.config.storage.generatedDir), resource.file_path);
                if (fs_1.default.existsSync(filePath)) {
                    archive.file(filePath, { name: path_1.default.basename(resource.file_path) });
                }
            }
        }
        await archive.finalize();
    }
    catch (error) {
        console.error('Error batch downloading resources:', error);
        res.status(500).json({ message: '批量下载失败' });
    }
});
exports.default = router;
//# sourceMappingURL=resource.js.map