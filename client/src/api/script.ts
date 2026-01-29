import http from './http';

// 口播稿会话
export interface ScriptSession {
  id: string;
  projectId: string;
  title?: string;
  currentScript?: string;
  status: 'active' | 'archived';
  createdAt: string;
  updatedAt: string;
}

// 口播稿消息
export interface ScriptMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  scriptVersion?: string;
  createdAt: string;
}

// 带消息的会话
export interface ScriptSessionWithMessages extends ScriptSession {
  messages: ScriptMessage[];
}

export interface ScriptSessionsResponse {
  sessions: ScriptSession[];
}

export interface ScriptSessionResponse {
  session: ScriptSession | ScriptSessionWithMessages;
}

export interface ScriptMessageResponse {
  message: ScriptMessage;
  script?: string;
}

export const scriptApi = {
  // 获取项目的所有口播稿会话
  getSessions(projectId: string): Promise<ScriptSessionsResponse> {
    return http.get(`/projects/${projectId}/script-sessions`);
  },

  // 创建新的口播稿会话
  createSession(projectId: string, title?: string): Promise<ScriptSessionResponse> {
    return http.post(`/projects/${projectId}/script-sessions`, { title });
  },

  // 获取会话详情（包含消息历史）
  getSession(sessionId: string): Promise<{ session: ScriptSessionWithMessages }> {
    return http.get(`/script-sessions/${sessionId}`);
  },

  // 更新会话信息
  updateSession(sessionId: string, data: { title?: string; status?: 'active' | 'archived' }): Promise<ScriptSessionResponse> {
    return http.put(`/script-sessions/${sessionId}`, data);
  },

  // 删除会话
  deleteSession(sessionId: string): Promise<{ success: boolean }> {
    return http.delete(`/script-sessions/${sessionId}`);
  },

  // 发送消息并获取AI回复
  sendMessage(sessionId: string, content: string): Promise<ScriptMessageResponse> {
    return http.post(`/script-sessions/${sessionId}/messages`, { content });
  },

  // 应用口播稿到项目
  applyScript(sessionId: string): Promise<{ session: ScriptSession; script: string }> {
    return http.post(`/script-sessions/${sessionId}/apply`);
  }
};
