import http from './http';
import type { Task, RegenerateType } from '../types';

export interface TaskResponse {
  task: Task;
}

export interface TasksResponse {
  tasks: Task[];
}

export const generationApi = {
  // 生成分镜图片
  generateImage(storyboardId: string, regenerate = false): Promise<{ taskId: string }> {
    return http.post(`/storyboards/${storyboardId}/generate/image`, { regenerate });
  },

  // 生成分镜视频
  generateVideo(storyboardId: string, regenerate = false): Promise<{ taskId: string }> {
    return http.post(`/storyboards/${storyboardId}/generate/video`, { regenerate });
  },

  // 生成口播文案
  generateNarration(projectId: string, regenerate = false): Promise<{ taskId: string }> {
    return http.post(`/projects/${projectId}/generate/narration`, { regenerate });
  },

  // 拆分口播文案
  splitNarration(projectId: string): Promise<{ storyboards: unknown[] }> {
    return http.post(`/projects/${projectId}/narration/split`);
  },

  // 生成语音
  generateSpeech(storyboardId: string, options?: { voiceId?: string; speed?: number; regenerate?: boolean }): Promise<{ taskId: string }> {
    return http.post(`/storyboards/${storyboardId}/generate/speech`, options);
  },

  // 合并视频
  mergeVideo(projectId: string, storyboardIds?: string[]): Promise<{ taskId: string }> {
    return http.post(`/projects/${projectId}/merge-video`, { storyboardIds });
  },

  // 批量生成
  batchGenerate(projectId: string, types: RegenerateType[], storyboardIds?: string[]): Promise<{ taskIds: string[] }> {
    return http.post(`/projects/${projectId}/generate/batch`, { types, storyboardIds });
  },

  // 获取任务状态
  getTask(taskId: string): Promise<TaskResponse> {
    return http.get(`/tasks/${taskId}`);
  },

  // 获取项目所有任务
  getProjectTasks(projectId: string): Promise<TasksResponse> {
    return http.get(`/projects/${projectId}/tasks`);
  }
};
