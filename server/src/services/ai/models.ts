import type { AIServiceType, FunctionType } from '../../types';

// 模型信息
export interface ModelInfo {
  id: string;
  name: string;
  capabilities: ModelCapability[];
  description?: string;
}

// 模型能力类型
export type ModelCapability = 'text' | 'image' | 'speech' | 'video' | 'embedding';

// 功能类型到能力的映射
const FUNCTION_TO_CAPABILITY: Record<FunctionType, ModelCapability> = {
  storyboard: 'text',
  narration: 'text',
  image: 'image',
  speech: 'speech',
  video: 'video'
};

// OpenAI 模型能力映射（基于模型ID前缀判断）
const OPENAI_MODEL_CAPABILITIES: Record<string, ModelCapability[]> = {
  'gpt-4': ['text'],
  'gpt-3.5': ['text'],
  'o1': ['text'],
  'o3': ['text'],
  'dall-e': ['image'],
  'tts': ['speech'],
  'whisper': ['speech'],
  'text-embedding': ['embedding'],
  'chatgpt-4o': ['text'],
};

// Claude 模型（文本生成）
const CLAUDE_MODELS: ModelInfo[] = [
  { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', capabilities: ['text'] },
  { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', capabilities: ['text'] },
  { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', capabilities: ['text'] },
  { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', capabilities: ['text'] },
  { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet', capabilities: ['text'] },
  { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', capabilities: ['text'] },
];

// Gemini 模型
const GEMINI_MODELS: ModelInfo[] = [
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', capabilities: ['text', 'image'] },
  { id: 'gemini-2.0-flash-lite', name: 'Gemini 2.0 Flash Lite', capabilities: ['text'] },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', capabilities: ['text'] },
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', capabilities: ['text'] },
  { id: 'imagen-3.0-generate-002', name: 'Imagen 3', capabilities: ['image'] },
];

// 通义千问模型
const QWEN_MODELS: ModelInfo[] = [
  { id: 'qwen-max', name: '通义千问-Max', capabilities: ['text'] },
  { id: 'qwen-plus', name: '通义千问-Plus', capabilities: ['text'] },
  { id: 'qwen-turbo', name: '通义千问-Turbo', capabilities: ['text'] },
  { id: 'qwen-vl-max', name: '通义千问VL-Max', capabilities: ['text', 'image'] },
  { id: 'wanx-v1', name: '通义万相', capabilities: ['image'] },
  { id: 'cosyvoice-v1', name: 'CosyVoice', capabilities: ['speech'] },
  { id: 'sambert-zhichu-v1', name: 'Sambert语音合成', capabilities: ['speech'] },
];

// 火山引擎模型（需要用户配置endpoint ID）
const VOLCENGINE_MODELS: ModelInfo[] = [
  { id: 'doubao-pro-32k', name: '豆包Pro 32K', capabilities: ['text'] },
  { id: 'doubao-lite-32k', name: '豆包Lite 32K', capabilities: ['text'] },
  { id: 'doubao-pro-128k', name: '豆包Pro 128K', capabilities: ['text'] },
  { id: 'doubao-pro-256k', name: '豆包Pro 256K', capabilities: ['text'] },
];

/**
 * 获取OpenAI模型列表
 */
async function fetchOpenAIModels(apiKey: string, endpoint?: string): Promise<ModelInfo[]> {
  const baseUrl = endpoint || 'https://api.openai.com/v1';

  try {
    const response = await fetch(`${baseUrl}/models`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json() as { data: { id: string; owned_by?: string }[] };

    return data.data.map(model => {
      const capabilities = getOpenAIModelCapabilities(model.id);
      return {
        id: model.id,
        name: model.id,
        capabilities
      };
    }).filter(m => m.capabilities.length > 0);
  } catch (error) {
    console.error('Error fetching OpenAI models:', error);
    throw error;
  }
}

/**
 * 根据模型ID推断OpenAI模型能力
 */
function getOpenAIModelCapabilities(modelId: string): ModelCapability[] {
  const id = modelId.toLowerCase();

  for (const [prefix, capabilities] of Object.entries(OPENAI_MODEL_CAPABILITIES)) {
    if (id.startsWith(prefix.toLowerCase())) {
      return capabilities;
    }
  }

  // 默认假设是文本模型
  if (id.includes('gpt') || id.includes('text') || id.includes('instruct')) {
    return ['text'];
  }

  return [];
}

/**
 * 获取Gemini模型列表
 */
async function fetchGeminiModels(apiKey: string, endpoint?: string): Promise<ModelInfo[]> {
  const baseUrl = endpoint || 'https://generativelanguage.googleapis.com/v1beta';

  try {
    const response = await fetch(`${baseUrl}/models?key=${apiKey}`);

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json() as {
      models: {
        name: string;
        displayName: string;
        supportedGenerationMethods?: string[];
      }[]
    };

    return data.models.map(model => {
      const modelId = model.name.replace('models/', '');
      const capabilities: ModelCapability[] = [];

      // 根据生成方法判断能力
      if (model.supportedGenerationMethods?.includes('generateContent')) {
        capabilities.push('text');
      }
      if (modelId.includes('imagen')) {
        capabilities.push('image');
      }

      return {
        id: modelId,
        name: model.displayName || modelId,
        capabilities
      };
    }).filter(m => m.capabilities.length > 0);
  } catch (error) {
    console.error('Error fetching Gemini models:', error);
    // 返回预定义模型列表作为备选
    return GEMINI_MODELS;
  }
}

/**
 * 获取Claude模型列表（Anthropic API不提供模型列表接口，使用预定义）
 */
async function fetchClaudeModels(_apiKey: string, _endpoint?: string): Promise<ModelInfo[]> {
  // Claude API没有模型列表接口，返回预定义模型
  return CLAUDE_MODELS;
}

/**
 * 获取通义千问模型列表
 */
async function fetchQwenModels(apiKey: string, endpoint?: string): Promise<ModelInfo[]> {
  const baseUrl = endpoint || 'https://dashscope.aliyuncs.com/api/v1';

  try {
    // 阿里云API获取模型列表
    const response = await fetch(`${baseUrl}/models`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    if (!response.ok) {
      // 如果API不可用，返回预定义列表
      return QWEN_MODELS;
    }

    const data = await response.json() as { data: { id: string; name?: string }[] };

    return data.data.map(model => {
      const capabilities = getQwenModelCapabilities(model.id);
      return {
        id: model.id,
        name: model.name || model.id,
        capabilities
      };
    }).filter(m => m.capabilities.length > 0);
  } catch (error) {
    console.error('Error fetching Qwen models:', error);
    return QWEN_MODELS;
  }
}

/**
 * 根据模型ID推断千问模型能力
 */
function getQwenModelCapabilities(modelId: string): ModelCapability[] {
  const id = modelId.toLowerCase();

  if (id.includes('wanx') || id.includes('imagen')) {
    return ['image'];
  }
  if (id.includes('cosyvoice') || id.includes('sambert') || id.includes('tts')) {
    return ['speech'];
  }
  if (id.includes('qwen')) {
    return ['text'];
  }

  return ['text'];
}

/**
 * 获取火山引擎模型列表
 */
async function fetchVolcengineModels(apiKey: string, endpoint?: string): Promise<ModelInfo[]> {
  const baseUrl = endpoint || 'https://ark.cn-beijing.volces.com/api/v3';

  try {
    const response = await fetch(`${baseUrl}/models`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    if (!response.ok) {
      return VOLCENGINE_MODELS;
    }

    const data = await response.json() as { data: { id: string; owned_by?: string }[] };

    return data.data.map(model => ({
      id: model.id,
      name: model.id,
      capabilities: ['text'] as ModelCapability[]
    }));
  } catch (error) {
    console.error('Error fetching Volcengine models:', error);
    return VOLCENGINE_MODELS;
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
 */
export async function getAvailableModels(
  serviceType: AIServiceType,
  functionType: FunctionType,
  apiKey: string,
  endpoint?: string
): Promise<ModelInfo[]> {
  const allModels = await fetchModels(serviceType, apiKey, endpoint);
  return filterModelsByFunction(allModels, functionType);
}
