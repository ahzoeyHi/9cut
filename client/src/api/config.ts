import http from './http';
import type { AIServiceConfig, Prompt, FunctionType } from '../types';

export interface AIServicesResponse {
  services: AIServiceConfig[];
}

export interface AIServiceResponse {
  service: AIServiceConfig;
}

export interface PromptsResponse {
  prompts: Prompt[];
}

export interface PromptResponse {
  prompt: Prompt;
}

export const configApi = {
  // AI服务配置
  getAIServices(): Promise<AIServicesResponse> {
    return http.get('/config/ai-services');
  },

  saveAIService(config: Partial<AIServiceConfig>): Promise<AIServiceResponse> {
    return http.post('/config/ai-services', config);
  },

  testAIService(id: string): Promise<{ success: boolean; message?: string }> {
    return http.post(`/config/ai-services/${id}/test`);
  },

  enableAIService(id: string): Promise<AIServiceResponse> {
    return http.post(`/config/ai-services/${id}/enable`);
  },

  // 提示词管理
  getPrompts(functionType?: FunctionType): Promise<PromptsResponse> {
    const params = functionType ? { functionType } : {};
    return http.get('/config/prompts', { params });
  },

  createPrompt(data: { name: string; content: string; functionType: FunctionType }): Promise<PromptResponse> {
    return http.post('/config/prompts', data);
  },

  updatePrompt(id: string, data: Partial<Prompt>): Promise<PromptResponse> {
    return http.put(`/config/prompts/${id}`, data);
  },

  deletePrompt(id: string): Promise<{ success: boolean }> {
    return http.delete(`/config/prompts/${id}`);
  },

  activatePrompt(id: string): Promise<PromptResponse> {
    return http.post(`/config/prompts/${id}/activate`);
  }
};
