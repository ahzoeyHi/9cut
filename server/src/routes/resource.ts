import { Router, Request, Response } from 'express';
import { resourceModel } from '../models/resource';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { config } from '../config';
import archiver from 'archiver';
import type { ResourceType } from '../types';

const router = Router();

// 配置文件上传
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const uploadDir = config.getAbsolutePath(config.storage.uploadDir);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB
  }
});

// 转换数据库字段为前端格式
function formatResource(r: any) {
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
router.get('/', (req: Request, res: Response) => {
  try {
    const { projectId, storyboardId, type } = req.query;

    const resources = resourceModel.findAll({
      projectId: projectId as string,
      storyboardId: storyboardId as string,
      type: type as ResourceType
    });

    res.json({
      resources: resources.map(formatResource)
    });
  } catch (error) {
    console.error('Error fetching resources:', error);
    res.status(500).json({ message: '获取资源列表失败' });
  }
});

// 上传资源
router.post('/upload', upload.single('file'), (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: '没有上传文件' });
    }

    const { type, storyboardId, projectId } = req.body;

    if (!type) {
      return res.status(400).json({ message: '资源类型不能为空' });
    }

    const resource = resourceModel.create({
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
  } catch (error) {
    console.error('Error uploading resource:', error);
    res.status(500).json({ message: '上传资源失败' });
  }
});

// 下载资源
router.get('/:id/download', (req: Request, res: Response) => {
  try {
    const resource = resourceModel.findById(req.params.id);

    if (!resource) {
      return res.status(404).json({ message: '资源不存在' });
    }

    const filePath = path.join(config.getAbsolutePath(config.storage.generatedDir), resource.file_path);

    if (!fs.existsSync(filePath)) {
      // 尝试从uploads目录查找
      const uploadPath = path.join(config.getAbsolutePath(config.storage.uploadDir), resource.file_path);
      if (fs.existsSync(uploadPath)) {
        return res.download(uploadPath);
      }
      return res.status(404).json({ message: '文件不存在' });
    }

    res.download(filePath);
  } catch (error) {
    console.error('Error downloading resource:', error);
    res.status(500).json({ message: '下载资源失败' });
  }
});

// 删除资源
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const resource = resourceModel.findById(req.params.id);

    if (!resource) {
      return res.status(404).json({ message: '资源不存在' });
    }

    // 删除物理文件
    const filePath = path.join(config.getAbsolutePath(config.storage.generatedDir), resource.file_path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    const uploadPath = path.join(config.getAbsolutePath(config.storage.uploadDir), resource.file_path);
    if (fs.existsSync(uploadPath)) {
      fs.unlinkSync(uploadPath);
    }

    // 删除数据库记录
    const success = resourceModel.delete(req.params.id);

    res.json({ success });
  } catch (error) {
    console.error('Error deleting resource:', error);
    res.status(500).json({ message: '删除资源失败' });
  }
});

// 批量下载
router.post('/batch-download', async (req: Request, res: Response) => {
  try {
    const { resourceIds } = req.body;

    if (!Array.isArray(resourceIds) || resourceIds.length === 0) {
      return res.status(400).json({ message: 'resourceIds必须是非空数组' });
    }

    const archive = archiver('zip', { zlib: { level: 9 } });

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename=resources.zip');

    archive.pipe(res);

    for (const id of resourceIds) {
      const resource = resourceModel.findById(id);
      if (resource) {
        const filePath = path.join(config.getAbsolutePath(config.storage.generatedDir), resource.file_path);
        if (fs.existsSync(filePath)) {
          archive.file(filePath, { name: path.basename(resource.file_path) });
        }
      }
    }

    await archive.finalize();
  } catch (error) {
    console.error('Error batch downloading resources:', error);
    res.status(500).json({ message: '批量下载失败' });
  }
});

export default router;
