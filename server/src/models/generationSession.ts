import db from '../database';
import { v4 as uuidv4 } from 'uuid';

// 生成会话类型
export type GenerationSessionType = 'storyboard' | 'image' | 'video' | 'speech';

// 生成会话
export interface GenerationSession {
  id: string;
  type: GenerationSessionType;
  project_id: string;
  storyboard_id?: string;
  title?: string;
  current_result?: string; // JSON字符串存储当前结果
  status: 'active' | 'archived';
  created_at: string;
  updated_at: string;
}

// 生成会话消息
export interface GenerationMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  result_snapshot?: string; // JSON字符串存储每次修改后的结果快照
  created_at: string;
}

// 带消息的会话
export interface GenerationSessionWithMessages extends GenerationSession {
  messages: GenerationMessage[];
}

export const generationSessionModel = {
  // 创建会话
  create(data: {
    type: GenerationSessionType;
    project_id: string;
    storyboard_id?: string;
    title?: string;
  }): GenerationSession {
    const id = uuidv4();
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO generation_sessions (id, type, project_id, storyboard_id, title, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'active', ?, ?)
    `);

    const titleDefault = data.title || this.getDefaultTitle(data.type);
    stmt.run(id, data.type, data.project_id, data.storyboard_id || null, titleDefault, now, now);

    return this.findById(id)!;
  },

  getDefaultTitle(type: GenerationSessionType): string {
    switch (type) {
      case 'storyboard': return '分镜修改';
      case 'image': return '图片修改';
      case 'video': return '视频修改';
      case 'speech': return '语音修改';
      default: return '新会话';
    }
  },

  // 根据ID查找会话
  findById(id: string): GenerationSession | null {
    const stmt = db.prepare('SELECT * FROM generation_sessions WHERE id = ?');
    return stmt.get(id) as GenerationSession | null;
  },

  // 根据项目ID和类型查找会话
  findByProjectAndType(projectId: string, type: GenerationSessionType): GenerationSession[] {
    const stmt = db.prepare(`
      SELECT * FROM generation_sessions
      WHERE project_id = ? AND type = ?
      ORDER BY updated_at DESC
    `);
    return stmt.all(projectId, type) as GenerationSession[];
  },

  // 根据分镜ID和类型查找会话
  findByStoryboardAndType(storyboardId: string, type: GenerationSessionType): GenerationSession[] {
    const stmt = db.prepare(`
      SELECT * FROM generation_sessions
      WHERE storyboard_id = ? AND type = ?
      ORDER BY updated_at DESC
    `);
    return stmt.all(storyboardId, type) as GenerationSession[];
  },

  // 更新会话
  update(id: string, data: Partial<GenerationSession>): GenerationSession | null {
    const session = this.findById(id);
    if (!session) return null;

    const updates: string[] = [];
    const values: unknown[] = [];

    if (data.title !== undefined) {
      updates.push('title = ?');
      values.push(data.title);
    }
    if (data.current_result !== undefined) {
      updates.push('current_result = ?');
      values.push(data.current_result);
    }
    if (data.status !== undefined) {
      updates.push('status = ?');
      values.push(data.status);
    }

    updates.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);

    const stmt = db.prepare(`
      UPDATE generation_sessions
      SET ${updates.join(', ')}
      WHERE id = ?
    `);
    stmt.run(...values);

    return this.findById(id);
  },

  // 删除会话
  delete(id: string): boolean {
    const stmt = db.prepare('DELETE FROM generation_sessions WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  },

  // 获取会话及其所有消息
  findWithMessages(id: string): GenerationSessionWithMessages | null {
    const session = this.findById(id);
    if (!session) return null;

    const messages = generationMessageModel.findBySessionId(id);

    return {
      ...session,
      messages
    };
  }
};

export const generationMessageModel = {
  // 创建消息
  create(data: {
    session_id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    result_snapshot?: string;
  }): GenerationMessage {
    const id = uuidv4();
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO generation_messages (id, session_id, role, content, result_snapshot, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(id, data.session_id, data.role, data.content, data.result_snapshot || null, now);

    // 更新会话的更新时间
    db.prepare('UPDATE generation_sessions SET updated_at = ? WHERE id = ?')
      .run(now, data.session_id);

    return this.findById(id)!;
  },

  // 根据ID查找消息
  findById(id: string): GenerationMessage | null {
    const stmt = db.prepare('SELECT * FROM generation_messages WHERE id = ?');
    return stmt.get(id) as GenerationMessage | null;
  },

  // 根据会话ID查找所有消息
  findBySessionId(sessionId: string): GenerationMessage[] {
    const stmt = db.prepare(`
      SELECT * FROM generation_messages
      WHERE session_id = ?
      ORDER BY created_at ASC
    `);
    return stmt.all(sessionId) as GenerationMessage[];
  },

  // 删除消息
  delete(id: string): boolean {
    const stmt = db.prepare('DELETE FROM generation_messages WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }
};
