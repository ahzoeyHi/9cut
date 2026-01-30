import http from './http';

// 生成会话类型
export type GenerationSessionType = 'storyboard' | 'image' | 'video' | 'speech';

// 生成会话
export interface GenerationSession {
  id: string;
  type: GenerationSessionType;
  projectId: string;
  storyboardId?: string;
  title?: string;
  currentResult?: string;
  status: 'active' | 'archived';
  createdAt: string;
  updatedAt: string;
}

// 生成会话消息
export interface GenerationMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  resultSnapshot?: string;
  createdAt: string;
}

// 带消息的会话
export interface GenerationSessionWithMessages extends GenerationSession {
  messages: GenerationMessage[];
}

export interface GenerationSessionsResponse {
  sessions: GenerationSession[];
}

export interface GenerationSessionResponse {
  session: GenerationSession | GenerationSessionWithMessages;
}

export interface GenerationMessageResponse {
  message: GenerationMessage;
  result?: string;
}

export const generationSessionApi = {
  // 获取分镜的修改会话列表
  getStoryboardSessions(storyboardId: string, type: GenerationSessionType): Promise<GenerationSessionsResponse> {
    return http.get(`/storyboards/${storyboardId}/generation-sessions`, { params: { type } });
  },

  // 获取项目的修改会话列表
  getProjectSessions(projectId: string, type: GenerationSessionType): Promise<GenerationSessionsResponse> {
    return http.get(`/projects/${projectId}/generation-sessions`, { params: { type } });
  },

  // 创建新的修改会话
  createSession(data: {
    type: GenerationSessionType;
    projectId: string;
    storyboardId?: string;
    title?: string;
  }): Promise<GenerationSessionResponse> {
    return http.post('/generation-sessions', data);
  },

  // 获取会话详情（包含消息历史）
  getSession(sessionId: string): Promise<{ session: GenerationSessionWithMessages }> {
    return http.get(`/generation-sessions/${sessionId}`);
  },

  // 更新会话信息
  updateSession(sessionId: string, data: { title?: string; status?: 'active' | 'archived' }): Promise<GenerationSessionResponse> {
    return http.put(`/generation-sessions/${sessionId}`, data);
  },

  // 删除会话
  deleteSession(sessionId: string): Promise<{ success: boolean }> {
    return http.delete(`/generation-sessions/${sessionId}`);
  },

  // 发送消息并获取AI回复
  sendMessage(sessionId: string, content: string): Promise<GenerationMessageResponse> {
    return http.post(`/generation-sessions/${sessionId}/messages`, { content });
  },

  // 应用分镜修改
  applyStoryboardChanges(sessionId: string): Promise<{ success: boolean }> {
    return http.post(`/generation-sessions/${sessionId}/apply-storyboard`);
  },

  // 应用图片提示词修改
  applyImageChanges(sessionId: string): Promise<{ success: boolean }> {
    return http.post(`/generation-sessions/${sessionId}/apply-image`);
  },

  // 应用视频参数修改
  applyVideoChanges(sessionId: string): Promise<{ success: boolean }> {
    return http.post(`/generation-sessions/${sessionId}/apply-video`);
  },

  // 应用语音参数修改
  applySpeechChanges(sessionId: string): Promise<{ success: boolean }> {
    return http.post(`/generation-sessions/${sessionId}/apply-speech`);
  },

  // 重新生成图片
  regenerateImage(sessionId: string, storyboardId: string): Promise<{ imagePath: string }> {
    return http.post(`/generation-sessions/${sessionId}/regenerate-image`, { storyboardId });
  }
};
