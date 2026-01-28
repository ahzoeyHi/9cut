import { Router, Request, Response } from 'express';
import { projectModel } from '../models/project';
import { storyboardModel } from '../models/storyboard';
import { resourceModel } from '../models/resource';

const router = Router();

// 转换数据库字段为前端格式
function formatProject(project: any) {
  return {
    id: project.id,
    name: project.name,
    description: project.description,
    script: project.script,
    status: project.status,
    createdAt: project.created_at,
    updatedAt: project.updated_at
  };
}

// 获取项目列表
router.get('/', (_req: Request, res: Response) => {
  try {
    const projects = projectModel.findAll();
    res.json({
      projects: projects.map(formatProject),
      total: projects.length
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ message: '获取项目列表失败' });
  }
});

// 获取项目详情
router.get('/:id', (req: Request, res: Response) => {
  try {
    const project = projectModel.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: '项目不存在' });
    }

    const storyboards = storyboardModel.findByProjectId(req.params.id);

    res.json({
      project: formatProject(project),
      storyboards: storyboards.map(s => ({
        id: s.id,
        projectId: s.project_id,
        sequence: s.sequence,
        sceneDescription: s.scene_description,
        visualDescription: s.visual_description,
        duration: s.duration,
        narration: s.narration,
        groupIndex: s.group_index,
        status: s.status,
        firstFrameUrl: s.first_frame_url,
        lastFrameUrl: s.last_frame_url,
        videoUrl: s.video_url,
        speechUrl: s.speech_url,
        createdAt: s.created_at,
        updatedAt: s.updated_at
      }))
    });
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ message: '获取项目详情失败' });
  }
});

// 创建项目
router.post('/', (req: Request, res: Response) => {
  try {
    const { name, description, script } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: '项目名称不能为空' });
    }

    const project = projectModel.create({
      name: name.trim(),
      description,
      script
    });

    res.status(201).json({
      project: formatProject(project)
    });
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ message: '创建项目失败' });
  }
});

// 更新项目
router.put('/:id', (req: Request, res: Response) => {
  try {
    const { name, description, script, status } = req.body;

    const project = projectModel.update(req.params.id, {
      name,
      description,
      script,
      status
    });

    if (!project) {
      return res.status(404).json({ message: '项目不存在' });
    }

    res.json({
      project: formatProject(project)
    });
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ message: '更新项目失败' });
  }
});

// 删除项目
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const projectId = req.params.id;

    // 检查项目是否存在
    const project = projectModel.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: '项目不存在' });
    }

    // 删除相关资源文件（TODO: 实际删除文件）
    resourceModel.deleteByProjectId(projectId);

    // 删除分镜
    storyboardModel.deleteByProjectId(projectId);

    // 删除项目
    const success = projectModel.delete(projectId);

    res.json({ success });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ message: '删除项目失败' });
  }
});

export default router;
