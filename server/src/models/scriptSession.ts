import db from '../database';
import { v4 as uuidv4 } from 'uuid';

// 口播稿会话
export interface ScriptSession {
  id: string;
  project_id: string;
  title?: string;
  current_script?: string;
  status: 'active' | 'archived';
  created_at: string;
  updated_at: string;
}

// 口播稿会话消息
export interface ScriptMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  script_version?: string;
  created_at: string;
}

// 带消息的会话
export interface ScriptSessionWithMessages extends ScriptSession {
  messages: ScriptMessage[];
}

export const scriptSessionModel = {
  // 创建会话
  create(data: {
    project_id: string;
    title?: string;
  }): ScriptSession {
    const id = uuidv4();
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO script_sessions (id, project_id, title, status, created_at, updated_at)
      VALUES (?, ?, ?, 'active', ?, ?)
    `);

    stmt.run(id, data.project_id, data.title || '新口播稿', now, now);

    return this.findById(id)!;
  },

  // 根据ID查找会话
  findById(id: string): ScriptSession | null {
    const stmt = db.prepare('SELECT * FROM script_sessions WHERE id = ?');
    return stmt.get(id) as ScriptSession | null;
  },

  // 根据项目ID查找所有会话
  findByProjectId(projectId: string): ScriptSession[] {
    const stmt = db.prepare(`
      SELECT * FROM script_sessions
      WHERE project_id = ?
      ORDER BY updated_at DESC
    `);
    return stmt.all(projectId) as ScriptSession[];
  },

  // 更新会话
  update(id: string, data: Partial<ScriptSession>): ScriptSession | null {
    const session = this.findById(id);
    if (!session) return null;

    const updates: string[] = [];
    const values: unknown[] = [];

    if (data.title !== undefined) {
      updates.push('title = ?');
      values.push(data.title);
    }
    if (data.current_script !== undefined) {
      updates.push('current_script = ?');
      values.push(data.current_script);
    }
    if (data.status !== undefined) {
      updates.push('status = ?');
      values.push(data.status);
    }

    updates.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);

    const stmt = db.prepare(`
      UPDATE script_sessions
      SET ${updates.join(', ')}
      WHERE id = ?
    `);
    stmt.run(...values);

    return this.findById(id);
  },

  // 删除会话
  delete(id: string): boolean {
    const stmt = db.prepare('DELETE FROM script_sessions WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  },

  // 获取会话及其所有消息
  findWithMessages(id: string): ScriptSessionWithMessages | null {
    const session = this.findById(id);
    if (!session) return null;

    const messages = scriptMessageModel.findBySessionId(id);

    return {
      ...session,
      messages
    };
  }
};

export const scriptMessageModel = {
  // 创建消息
  create(data: {
    session_id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    script_version?: string;
  }): ScriptMessage {
    const id = uuidv4();
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO script_messages (id, session_id, role, content, script_version, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(id, data.session_id, data.role, data.content, data.script_version || null, now);

    // 更新会话的更新时间
    db.prepare('UPDATE script_sessions SET updated_at = ? WHERE id = ?')
      .run(now, data.session_id);

    return this.findById(id)!;
  },

  // 根据ID查找消息
  findById(id: string): ScriptMessage | null {
    const stmt = db.prepare('SELECT * FROM script_messages WHERE id = ?');
    return stmt.get(id) as ScriptMessage | null;
  },

  // 根据会话ID查找所有消息
  findBySessionId(sessionId: string): ScriptMessage[] {
    const stmt = db.prepare(`
      SELECT * FROM script_messages
      WHERE session_id = ?
      ORDER BY created_at ASC
    `);
    return stmt.all(sessionId) as ScriptMessage[];
  },

  // 删除消息
  delete(id: string): boolean {
    const stmt = db.prepare('DELETE FROM script_messages WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }
};
