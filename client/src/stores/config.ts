import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { AIServiceConfig, Prompt, FunctionType } from '../types';
import { configApi } from '../api/config';

export const useConfigStore = defineStore('config', () => {
  const aiServices = ref<AIServiceConfig[]>([]);
  const prompts = ref<Prompt[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // 获取指定功能的生效AI服务
  function getActiveService(functionType: FunctionType): AIServiceConfig | undefined {
    return aiServices.value.find(s => s.functionType === functionType && s.isEnabled);
  }

  // 获取指定功能的生效提示词
  function getActivePrompt(functionType: FunctionType): Prompt | undefined {
    return prompts.value.find(p => p.functionType === functionType && p.isActive);
  }

  async function fetchAIServices() {
    loading.value = true;
    error.value = null;
    try {
      const response = await configApi.getAIServices();
      aiServices.value = response.services;
    } catch (e) {
      error.value = e instanceof Error ? e.message : '获取AI服务配置失败';
    } finally {
      loading.value = false;
    }
  }

  async function saveAIService(config: Partial<AIServiceConfig>) {
    loading.value = true;
    error.value = null;
    try {
      const response = await configApi.saveAIService(config);
      const index = aiServices.value.findIndex(s => s.id === response.service.id);
      if (index !== -1) {
        aiServices.value[index] = response.service;
      } else {
        aiServices.value.push(response.service);
      }
      return response.service;
    } catch (e) {
      error.value = e instanceof Error ? e.message : '保存AI服务配置失败';
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function testAIService(id: string) {
    try {
      const response = await configApi.testAIService(id);
      return response;
    } catch (e) {
      throw e;
    }
  }

  async function enableAIService(id: string) {
    loading.value = true;
    error.value = null;
    try {
      const response = await configApi.enableAIService(id);
      // 更新本地状态，同类型的其他服务设为禁用
      const service = response.service;
      aiServices.value = aiServices.value.map(s => {
        if (s.functionType === service.functionType) {
          return { ...s, isEnabled: s.id === id };
        }
        return s;
      });
      return service;
    } catch (e) {
      error.value = e instanceof Error ? e.message : '启用AI服务失败';
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function fetchPrompts(functionType?: FunctionType) {
    loading.value = true;
    error.value = null;
    try {
      const response = await configApi.getPrompts(functionType);
      if (functionType) {
        // 只更新指定类型的提示词
        prompts.value = [
          ...prompts.value.filter(p => p.functionType !== functionType),
          ...response.prompts
        ];
      } else {
        prompts.value = response.prompts;
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : '获取提示词失败';
    } finally {
      loading.value = false;
    }
  }

  async function createPrompt(data: { name: string; content: string; functionType: FunctionType }) {
    loading.value = true;
    error.value = null;
    try {
      const response = await configApi.createPrompt(data);
      prompts.value.push(response.prompt);
      return response.prompt;
    } catch (e) {
      error.value = e instanceof Error ? e.message : '创建提示词失败';
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function updatePrompt(id: string, data: Partial<Prompt>) {
    loading.value = true;
    error.value = null;
    try {
      const response = await configApi.updatePrompt(id, data);
      const index = prompts.value.findIndex(p => p.id === id);
      if (index !== -1) {
        prompts.value[index] = response.prompt;
      }
      return response.prompt;
    } catch (e) {
      error.value = e instanceof Error ? e.message : '更新提示词失败';
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function deletePrompt(id: string) {
    loading.value = true;
    error.value = null;
    try {
      await configApi.deletePrompt(id);
      prompts.value = prompts.value.filter(p => p.id !== id);
    } catch (e) {
      error.value = e instanceof Error ? e.message : '删除提示词失败';
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function activatePrompt(id: string) {
    loading.value = true;
    error.value = null;
    try {
      const response = await configApi.activatePrompt(id);
      const prompt = response.prompt;
      // 更新本地状态
      prompts.value = prompts.value.map(p => {
        if (p.functionType === prompt.functionType) {
          return { ...p, isActive: p.id === id };
        }
        return p;
      });
      return prompt;
    } catch (e) {
      error.value = e instanceof Error ? e.message : '激活提示词失败';
      throw e;
    } finally {
      loading.value = false;
    }
  }

  return {
    aiServices,
    prompts,
    loading,
    error,
    getActiveService,
    getActivePrompt,
    fetchAIServices,
    saveAIService,
    testAIService,
    enableAIService,
    fetchPrompts,
    createPrompt,
    updatePrompt,
    deletePrompt,
    activatePrompt
  };
});
