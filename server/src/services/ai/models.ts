import type { AIServiceType, FunctionType } from '../../types';
import { getConfiguredModels, type ModelInfo, type ModelCapability } from './modelConfig';

// 重新导出类型
export type { ModelInfo, ModelCapability } from './modelConfig';

// 功能类型到能力的映射
const FUNCTION_TO_CAPABILITY: Record<FunctionType, ModelCapability> = {
  storyboard: 'text',
  narration: 'text',
  image: 'image',
  speech: 'speech',
  video: 'video'
};

/**
 * 获取OpenAI模型列表
 * 优先从API获取，失败时使用配置的模型列表
 */
async function fetchOpenAIModels(apiKey: string, endpoint?: string): Promise<ModelInfo[]> {
  const baseUrl = endpoint || 'https://api.openai.com/v1';
  const configuredModels = getConfiguredModels('openai');

  try {
    const response = await fetch(`${baseUrl}/models`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    if (!response.ok) {
      console.log('[Models] OpenAI API failed, using configured models');
      return configuredModels;
    }

    const data = await response.json() as { data: { id: string; owned_by?: string }[] };

    // 将API返回的模型与配置的模型合并
    // 配置的模型有明确的能力映射，API返回的模型使用配置中的映射或默认全能力
    const configuredMap = new Map(configuredModels.map(m => [m.id, m]));

    const models = data.data.map(model => {
      const configured = configuredMap.get(model.id);
      if (configured) {
        return configured;
      }
      // 未在配置中的模型，标记为全能力让用户自行选择
      return {
        id: model.id,
        name: model.id,
        capabilities: ['text', 'image', 'speech', 'video'] as ModelCapability[]
      };
    });

    return models.sort((a, b) => a.id.localeCompare(b.id));
  } catch (error) {
    console.error('Error fetching OpenAI models:', error);
    return configuredModels;
  }
}

/**
 * 获取Claude模型列表（Anthropic API不提供模型列表接口，使用配置）
 */
async function fetchClaudeModels(_apiKey: string, _endpoint?: string): Promise<ModelInfo[]> {
  return getConfiguredModels('claude');
}

/**
 * 获取Gemini模型列表
 */
async function fetchGeminiModels(apiKey: string, endpoint?: string): Promise<ModelInfo[]> {
  const baseUrl = endpoint || 'https://generativelanguage.googleapis.com/v1beta';
  const configuredModels = getConfiguredModels('gemini');

  try {
    const response = await fetch(`${baseUrl}/models?key=${apiKey}`);

    if (!response.ok) {
      console.log('[Models] Gemini API failed, using configured models');
      return configuredModels;
    }

    const data = await response.json() as {
      models: {
        name: string;
        displayName: string;
        supportedGenerationMethods?: string[];
      }[]
    };

    const configuredMap = new Map(configuredModels.map(m => [m.id, m]));

    const models = data.models.map(model => {
      const modelId = model.name.replace('models/', '');
      const configured = configuredMap.get(modelId);

      if (configured) {
        return configured;
      }

      // 根据生成方法推断能力
      const capabilities: ModelCapability[] = [];
      if (model.supportedGenerationMethods?.includes('generateContent')) {
        capabilities.push('text');
      }
      if (modelId.includes('imagen')) {
        capabilities.push('image');
      }

      if (capabilities.length === 0) {
        capabilities.push('text'); // 默认文本能力
      }

      return {
        id: modelId,
        name: model.displayName || modelId,
        capabilities
      };
    }).filter(m => m.capabilities.length > 0);

    return models;
  } catch (error) {
    console.error('Error fetching Gemini models:', error);
    return configuredModels;
  }
}

/**
 * 获取通义千问模型列表
 */
async function fetchQwenModels(apiKey: string, endpoint?: string): Promise<ModelInfo[]> {
  const baseUrl = endpoint || 'https://dashscope.aliyuncs.com/api/v1';
  const configuredModels = getConfiguredModels('qwen');

  try {
    const response = await fetch(`${baseUrl}/models`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    if (!response.ok) {
      return configuredModels;
    }

    const data = await response.json() as { data: { id: string; name?: string }[] };
    const configuredMap = new Map(configuredModels.map(m => [m.id, m]));

    const models = data.data.map(model => {
      const configured = configuredMap.get(model.id);
      if (configured) {
        return configured;
      }
      return {
        id: model.id,
        name: model.name || model.id,
        capabilities: ['text', 'image', 'speech', 'video'] as ModelCapability[]
      };
    });

    return models.sort((a, b) => a.id.localeCompare(b.id));
  } catch (error) {
    console.error('Error fetching Qwen models:', error);
    return configuredModels;
  }
}

/**
 * 获取火山引擎模型列表
 */
async function fetchVolcengineModels(apiKey: string, endpoint?: string): Promise<ModelInfo[]> {
  const baseUrl = endpoint || 'https://ark.cn-beijing.volces.com/api/v3';
  const configuredModels = getConfiguredModels('volcengine');

  try {
    const response = await fetch(`${baseUrl}/models`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    if (!response.ok) {
      return configuredModels;
    }

    const data = await response.json() as { data: { id: string; owned_by?: string }[] };
    const configuredMap = new Map(configuredModels.map(m => [m.id, m]));

    const models = data.data.map(model => {
      const configured = configuredMap.get(model.id);
      if (configured) {
        return configured;
      }
      return {
        id: model.id,
        name: model.id,
        capabilities: ['text', 'image', 'speech', 'video'] as ModelCapability[]
      };
    });

    return models.sort((a, b) => a.id.localeCompare(b.id));
  } catch (error) {
    console.error('Error fetching Volcengine models:', error);
    return configuredModels;
  }
}

/**
 * 获取Kimi模型列表（Moonshot API兼容OpenAI格式）
 */
async function fetchKimiModels(apiKey: string, endpoint?: string): Promise<ModelInfo[]> {
  // 默认Kimi API地址
  const baseUrl = endpoint || 'https://api.moonshot.cn/v1';
  return fetchOpenAICompatibleModels(apiKey, baseUrl, 'kimi');
}

/**
 * 获取智谱GLM模型列表（GLM API兼容OpenAI格式）
 */
async function fetchGLMModels(apiKey: string, endpoint?: string): Promise<ModelInfo[]> {
  // 默认智谱API地址
  const baseUrl = endpoint || 'https://open.bigmodel.cn/api/paas/v4';
  return fetchOpenAICompatibleModels(apiKey, baseUrl, 'glm');
}

/**
 * 获取DeepSeek模型列表（DeepSeek API兼容OpenAI格式）
 */
async function fetchDeepSeekModels(apiKey: string, endpoint?: string): Promise<ModelInfo[]> {
  // 默认DeepSeek API地址
  const baseUrl = endpoint || 'https://api.deepseek.com';
  return fetchOpenAICompatibleModels(apiKey, baseUrl, 'deepseek');
}

/**
 * 通用的OpenAI兼容API模型获取函数
 */
async function fetchOpenAICompatibleModels(apiKey: string, baseUrl: string, serviceType: AIServiceType): Promise<ModelInfo[]> {
  const configuredModels = getConfiguredModels(serviceType);

  try {
    const response = await fetch(`${baseUrl}/models`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    if (!response.ok) {
      console.log(`[Models] ${serviceType} API failed, using configured models`);
      return configuredModels;
    }

    const data = await response.json() as { data: { id: string; owned_by?: string }[] };
    const configuredMap = new Map(configuredModels.map(m => [m.id, m]));

    const models = data.data.map(model => {
      const configured = configuredMap.get(model.id);
      if (configured) {
        return configured;
      }
      return {
        id: model.id,
        name: model.id,
        capabilities: ['text'] as ModelCapability[] // 默认假设为文本能力
      };
    });

    return models.sort((a, b) => a.id.localeCompare(b.id));
  } catch (error) {
    console.error(`Error fetching ${serviceType} models:`, error);
    return configuredModels;
  }
}

/**
 * 获取指定服务的模型列表
 */
export async function fetchModels(
  serviceType: AIServiceType,
  apiKey: string,
  endpoint?: string
): Promise<ModelInfo[]> {
  switch (serviceType) {
    case 'openai':
      return fetchOpenAIModels(apiKey, endpoint);
    case 'claude':
      return fetchClaudeModels(apiKey, endpoint);
    case 'gemini':
      return fetchGeminiModels(apiKey, endpoint);
    case 'qwen':
      return fetchQwenModels(apiKey, endpoint);
    case 'volcengine':
      return fetchVolcengineModels(apiKey, endpoint);
    case 'kimi':
      return fetchKimiModels(apiKey, endpoint);
    case 'glm':
      return fetchGLMModels(apiKey, endpoint);
    case 'deepseek':
      return fetchDeepSeekModels(apiKey, endpoint);
    default:
      throw new Error(`Unsupported service type: ${serviceType}`);
  }
}

/**
 * 根据功能类型过滤模型列表
 */
export function filterModelsByFunction(
  models: ModelInfo[],
  functionType: FunctionType
): ModelInfo[] {
  const requiredCapability = FUNCTION_TO_CAPABILITY[functionType];
  return models.filter(model => model.capabilities.includes(requiredCapability));
}

/**
 * 获取指定服务和功能类型的可用模型列表
 * 注意：现在返回所有模型，不再按功能类型过滤，让用户自己选择
 */
export async function getAvailableModels(
  serviceType: AIServiceType,
  _functionType: FunctionType,
  apiKey: string,
  endpoint?: string
): Promise<ModelInfo[]> {
  return fetchModels(serviceType, apiKey, endpoint);
}

/**
 * 获取配置的模型列表（不调用API，直接返回配置）
 */
export function getStaticModels(serviceType: AIServiceType): ModelInfo[] {
  return getConfiguredModels(serviceType);
}
