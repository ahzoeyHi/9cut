import { Router, Request, Response } from 'express';
import { storyboardModel } from '../models/storyboard';
import { taskModel } from '../models/task';
import { regenerateSingleStoryboard } from '../services/generation/storyboard';

const router = Router();

// 转换数据库字段为前端格式
function formatStoryboard(s: any) {
  return {
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
  };
}

function formatGroup(g: any) {
  return {
    id: g.id,
    index: g.index,
    storyboards: g.storyboards.map(formatStoryboard),
    mergedVideoId: g.merged_video_id,
    mergedVideoUrl: g.merged_video_url,
    status: g.status
  };
}

// 获取项目的分镜列表
router.get('/projects/:projectId/storyboards', (req: Request, res: Response) => {
  try {
    const projectId = req.params.projectId;
    const storyboards = storyboardModel.findByProjectId(projectId);
    const groups = storyboardModel.getGroups(projectId);

    res.json({
      storyboards: storyboards.map(formatStoryboard),
      groups: groups.map(formatGroup)
    });
  } catch (error) {
    console.error('Error fetching storyboards:', error);
    res.status(500).json({ message: '获取分镜列表失败' });
  }
});

// 更新分镜
router.put('/storyboards/:id', (req: Request, res: Response) => {
  try {
    const { sceneDescription, visualDescription, duration, narration, status } = req.body;

    const storyboard = storyboardModel.update(req.params.id, {
      scene_description: sceneDescription,
      visual_description: visualDescription,
      duration,
      narration,
      status
    });

    if (!storyboard) {
      return res.status(404).json({ message: '分镜不存在' });
    }

    res.json({
      storyboard: formatStoryboard(storyboard)
    });
  } catch (error) {
    console.error('Error updating storyboard:', error);
    res.status(500).json({ message: '更新分镜失败' });
  }
});

// 调整分镜顺序
router.post('/projects/:projectId/storyboards/reorder', (req: Request, res: Response) => {
  try {
    const { storyboardIds } = req.body;
    const projectId = req.params.projectId;

    if (!Array.isArray(storyboardIds)) {
      return res.status(400).json({ message: 'storyboardIds必须是数组' });
    }

    const storyboards = storyboardModel.updateSequences(projectId, storyboardIds);

    res.json({
      storyboards: storyboards.map(formatStoryboard)
    });
  } catch (error) {
    console.error('Error reordering storyboards:', error);
    res.status(500).json({ message: '调整顺序失败' });
  }
});

// 生成分镜
router.post('/projects/:projectId/storyboards/generate', (req: Request, res: Response) => {
  try {
    const projectId = req.params.projectId;
    const { regenerate } = req.body;

    // 如果需要重新生成，先删除旧分镜
    if (regenerate) {
      storyboardModel.deleteByProjectId(projectId);
    }

    // 创建生成任务
    const task = taskModel.create({
      type: 'storyboard',
      project_id: projectId
    });

    // TODO: 实际的生成逻辑将在后台任务中执行
    // 这里先返回任务ID

    res.json({ taskId: task.id });
  } catch (error) {
    console.error('Error generating storyboards:', error);
    res.status(500).json({ message: '生成分镜失败' });
  }
});

// 重新生成单个分镜
router.post('/storyboards/:id/regenerate', async (req: Request, res: Response) => {
  try {
    const { instruction } = req.body;

    if (!instruction || !instruction.trim()) {
      return res.status(400).json({ message: '请输入修改指令' });
    }

    const result = await regenerateSingleStoryboard(req.params.id, instruction.trim());

    if (!result.success) {
      return res.status(400).json({ message: result.error });
    }

    res.json({
      storyboard: result.storyboard,
      success: true
    });
  } catch (error) {
    console.error('Error regenerating storyboard:', error);
    res.status(500).json({ message: '重新生成分镜失败' });
  }
});

export default router;
