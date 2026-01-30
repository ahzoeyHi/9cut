import { Router, Request, Response } from 'express';
import {
  createScriptSession,
  sendMessage,
  getSessionWithMessages,
  getProjectSessions,
  updateSession,
  deleteSession,
  applyScriptToProject
} from '../services/generation/script';

const router = Router();

// 转换会话数据格式
function formatSession(session: any) {
  return {
    id: session.id,
    projectId: session.project_id,
    title: session.title,
    currentScript: session.current_script,
    status: session.status,
    createdAt: session.created_at,
    updatedAt: session.updated_at
  };
}

// 转换消息数据格式
function formatMessage(message: any) {
  return {
    id: message.id,
    sessionId: message.session_id,
    role: message.role,
    content: message.content,
    scriptVersion: message.script_version,
    createdAt: message.created_at
  };
}

// 获取项目的所有口播稿会话
router.get('/projects/:projectId/script-sessions', (req: Request, res: Response) => {
  try {
    const sessions = getProjectSessions(req.params.projectId);
    res.json({
      sessions: sessions.map(formatSession)
    });
  } catch (error) {
    console.error('Error fetching script sessions:', error);
    res.status(500).json({ message: '获取口播稿会话列表失败' });
  }
});

// 创建新的口播稿会话
router.post('/projects/:projectId/script-sessions', (req: Request, res: Response) => {
  try {
    const { title } = req.body;
    const session = createScriptSession(req.params.projectId, title);
    res.status(201).json({
      session: formatSession(session)
    });
  } catch (error) {
    console.error('Error creating script session:', error);
    res.status(500).json({ message: '创建口播稿会话失败' });
  }
});

// 获取会话详情（包含消息历史）
router.get('/script-sessions/:id', (req: Request, res: Response) => {
  try {
    const session = getSessionWithMessages(req.params.id);
    if (!session) {
      return res.status(404).json({ message: '会话不存在' });
    }

    res.json({
      session: {
        ...formatSession(session),
        messages: session.messages.map(formatMessage)
      }
    });
  } catch (error) {
    console.error('Error fetching script session:', error);
    res.status(500).json({ message: '获取口播稿会话详情失败' });
  }
});

// 更新会话信息
router.put('/script-sessions/:id', (req: Request, res: Response) => {
  try {
    const { title, status } = req.body;
    const session = updateSession(req.params.id, { title, status });
    if (!session) {
      return res.status(404).json({ message: '会话不存在' });
    }

    res.json({
      session: formatSession(session)
    });
  } catch (error) {
    console.error('Error updating script session:', error);
    res.status(500).json({ message: '更新口播稿会话失败' });
  }
});

// 删除会话
router.delete('/script-sessions/:id', (req: Request, res: Response) => {
  try {
    const success = deleteSession(req.params.id);
    if (!success) {
      return res.status(404).json({ message: '会话不存在' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting script session:', error);
    res.status(500).json({ message: '删除口播稿会话失败' });
  }
});

// 发送消息并获取AI回复
router.post('/script-sessions/:id/messages', async (req: Request, res: Response) => {
  try {
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: '消息内容不能为空' });
    }

    const result = await sendMessage(req.params.id, content.trim());

    res.json({
      message: formatMessage(result.message),
      script: result.script
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      message: error instanceof Error ? error.message : '发送消息失败'
    });
  }
});

// 应用口播稿到项目
router.post('/script-sessions/:id/apply', (req: Request, res: Response) => {
  try {
    const result = applyScriptToProject(req.params.id);
    if (!result) {
      return res.status(404).json({ message: '会话不存在或没有口播稿内容' });
    }

    res.json({
      session: formatSession(result.session),
      script: result.session.current_script,
      success: true
    });
  } catch (error) {
    console.error('Error applying script:', error);
    res.status(500).json({ message: '应用口播稿失败' });
  }
});

export default router;
