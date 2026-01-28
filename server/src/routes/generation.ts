import { Router, Request, Response } from 'express';
import { taskModel } from '../models/task';

const router = Router();

// 转换数据库字段为前端格式
function formatTask(t: any) {
  return {
    id: t.id,
    type: t.type,
    status: t.status,
    projectId: t.project_id,
    storyboardId: t.storyboard_id,
    progress: t.progress,
    result: t.result ? JSON.parse(t.result) : undefined,
    error: t.error,
    startedAt: t.started_at,
    completedAt: t.completed_at,
    createdAt: t.created_at
  };
}

// 获取任务状态
router.get('/tasks/:taskId', (req: Request, res: Response) => {
  try {
    const task = taskModel.findById(req.params.taskId);

    if (!task) {
      return res.status(404).json({ message: '任务不存在' });
    }

    res.json({
      task: formatTask(task)
    });
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ message: '获取任务状态失败' });
  }
});

// 获取项目所有任务
router.get('/projects/:projectId/tasks', (req: Request, res: Response) => {
  try {
    const tasks = taskModel.findByProjectId(req.params.projectId);

    res.json({
      tasks: tasks.map(formatTask)
    });
  } catch (error) {
    console.error('Error fetching project tasks:', error);
    res.status(500).json({ message: '获取项目任务失败' });
  }
});

// 生成分镜图片
router.post('/storyboards/:id/generate/image', (req: Request, res: Response) => {
  try {
    const storyboardId = req.params.id;

    const task = taskModel.create({
      type: 'image',
      storyboard_id: storyboardId
    });

    // TODO: 实际的生成逻辑

    res.json({ taskId: task.id });
  } catch (error) {
    console.error('Error generating image:', error);
    res.status(500).json({ message: '生成图片失败' });
  }
});

// 生成分镜视频
router.post('/storyboards/:id/generate/video', (req: Request, res: Response) => {
  try {
    const storyboardId = req.params.id;

    const task = taskModel.create({
      type: 'video',
      storyboard_id: storyboardId
    });

    // TODO: 实际的生成逻辑

    res.json({ taskId: task.id });
  } catch (error) {
    console.error('Error generating video:', error);
    res.status(500).json({ message: '生成视频失败' });
  }
});

// 生成口播文案
router.post('/projects/:projectId/generate/narration', (req: Request, res: Response) => {
  try {
    const projectId = req.params.projectId;

    const task = taskModel.create({
      type: 'narration',
      project_id: projectId
    });

    // TODO: 实际的生成逻辑

    res.json({ taskId: task.id });
  } catch (error) {
    console.error('Error generating narration:', error);
    res.status(500).json({ message: '生成口播文案失败' });
  }
});

// 拆分口播文案
router.post('/projects/:projectId/narration/split', (req: Request, res: Response) => {
  try {
    // TODO: 实际的拆分逻辑

    res.json({ storyboards: [] });
  } catch (error) {
    console.error('Error splitting narration:', error);
    res.status(500).json({ message: '拆分口播文案失败' });
  }
});

// 生成语音
router.post('/storyboards/:id/generate/speech', (req: Request, res: Response) => {
  try {
    const storyboardId = req.params.id;

    const task = taskModel.create({
      type: 'speech',
      storyboard_id: storyboardId
    });

    // TODO: 实际的生成逻辑

    res.json({ taskId: task.id });
  } catch (error) {
    console.error('Error generating speech:', error);
    res.status(500).json({ message: '生成语音失败' });
  }
});

// 合并视频
router.post('/projects/:projectId/merge-video', (req: Request, res: Response) => {
  try {
    const projectId = req.params.projectId;

    const task = taskModel.create({
      type: 'merge',
      project_id: projectId
    });

    // TODO: 实际的合并逻辑

    res.json({ taskId: task.id });
  } catch (error) {
    console.error('Error merging video:', error);
    res.status(500).json({ message: '合并视频失败' });
  }
});

// 批量生成
router.post('/projects/:projectId/generate/batch', (req: Request, res: Response) => {
  try {
    const projectId = req.params.projectId;
    const { types } = req.body;

    if (!Array.isArray(types) || types.length === 0) {
      return res.status(400).json({ message: 'types必须是非空数组' });
    }

    const taskIds: string[] = [];

    for (const type of types) {
      const task = taskModel.create({
        type,
        project_id: projectId
      });
      taskIds.push(task.id);
    }

    // TODO: 实际的生成逻辑

    res.json({ taskIds });
  } catch (error) {
    console.error('Error batch generating:', error);
    res.status(500).json({ message: '批量生成失败' });
  }
});

export default router;
