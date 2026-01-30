import type { AIServiceType } from '../../types';

// 模型能力类型
export type ModelCapability = 'text' | 'image' | 'speech' | 'video' | 'embedding';

// 模型信息
export interface ModelInfo {
  id: string;
  name: string;
  capabilities: ModelCapability[];
  description?: string;
}

// 模型配置格式: "模型ID:显示名称:能力1,能力2"
// 例如: "gpt-4o:GPT-4o:text,image" 或 "gpt-4o::text" (名称留空则使用ID)

/**
 * 解析单个模型配置字符串
 */
function parseModelConfig(config: string): ModelInfo | null {
  const parts = config.split(':');
  if (parts.length < 2) return null;

  const id = parts[0].trim();
  if (!id) return null;

  const name = parts[1]?.trim() || id;
  const capabilitiesStr = parts[2]?.trim() || 'text';
  const capabilities = capabilitiesStr.split(',').map(c => c.trim()) as ModelCapability[];

  return { id, name, capabilities };
}

/**
 * 解析模型列表配置字符串
 * 格式: "模型1|模型2|模型3" 每个模型格式为 "ID:名称:能力1,能力2"
 */
function parseModelListConfig(configStr: string): ModelInfo[] {
  if (!configStr || !configStr.trim()) return [];

  return configStr
    .split('|')
    .map(c => parseModelConfig(c.trim()))
    .filter((m): m is ModelInfo => m !== null);
}

// ==========================================
// 默认模型列表（硬编码作为备选）
// ==========================================

const DEFAULT_OPENAI_MODELS: ModelInfo[] = [
  { id: 'gpt-4o', name: 'GPT-4o', capabilities: ['text', 'image'] },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', capabilities: ['text', 'image'] },
  { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', capabilities: ['text'] },
  { id: 'gpt-4', name: 'GPT-4', capabilities: ['text'] },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', capabilities: ['text'] },
  { id: 'o1', name: 'O1', capabilities: ['text'] },
  { id: 'o1-mini', name: 'O1 Mini', capabilities: ['text'] },
  { id: 'o1-preview', name: 'O1 Preview', capabilities: ['text'] },
  { id: 'o3-mini', name: 'O3 Mini', capabilities: ['text'] },
  { id: 'dall-e-3', name: 'DALL-E 3', capabilities: ['image'] },
  { id: 'dall-e-2', name: 'DALL-E 2', capabilities: ['image'] },
  { id: 'tts-1', name: 'TTS-1', capabilities: ['speech'] },
  { id: 'tts-1-hd', name: 'TTS-1 HD', capabilities: ['speech'] },
  { id: 'whisper-1', name: 'Whisper', capabilities: ['speech'] },
];

const DEFAULT_CLAUDE_MODELS: ModelInfo[] = [
  { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', capabilities: ['text'] },
  { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', capabilities: ['text'] },
  { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', capabilities: ['text'] },
  { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', capabilities: ['text'] },
  { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet', capabilities: ['text'] },
  { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', capabilities: ['text'] },
];

const DEFAULT_GEMINI_MODELS: ModelInfo[] = [
  { id: 'gemini-2.5-pro-preview-05-06', name: 'Gemini 2.5 Pro', capabilities: ['text', 'image'] },
  { id: 'gemini-2.5-flash-preview-05-20', name: 'Gemini 2.5 Flash', capabilities: ['text', 'image'] },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', capabilities: ['text', 'image'] },
  { id: 'gemini-2.0-flash-lite', name: 'Gemini 2.0 Flash Lite', capabilities: ['text'] },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', capabilities: ['text'] },
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', capabilities: ['text'] },
  { id: 'imagen-3.0-generate-002', name: 'Imagen 3', capabilities: ['image'] },
];

const DEFAULT_QWEN_MODELS: ModelInfo[] = [
  { id: 'qwen-max', name: '通义千问-Max', capabilities: ['text'] },
  { id: 'qwen-max-latest', name: '通义千问-Max最新', capabilities: ['text'] },
  { id: 'qwen-plus', name: '通义千问-Plus', capabilities: ['text'] },
  { id: 'qwen-plus-latest', name: '通义千问-Plus最新', capabilities: ['text'] },
  { id: 'qwen-turbo', name: '通义千问-Turbo', capabilities: ['text'] },
  { id: 'qwen-turbo-latest', name: '通义千问-Turbo最新', capabilities: ['text'] },
  { id: 'qwen-vl-max', name: '通义千问VL-Max', capabilities: ['text', 'image'] },
  { id: 'qwen-vl-plus', name: '通义千问VL-Plus', capabilities: ['text', 'image'] },
  { id: 'wanx-v1', name: '通义万相', capabilities: ['image'] },
  { id: 'wanx2.1-t2i-turbo', name: '通义万相2.1-Turbo', capabilities: ['image'] },
  { id: 'wanx2.1-t2i-plus', name: '通义万相2.1-Plus', capabilities: ['image'] },
  { id: 'cosyvoice-v1', name: 'CosyVoice', capabilities: ['speech'] },
  { id: 'sambert-zhichu-v1', name: 'Sambert语音合成', capabilities: ['speech'] },
];

const DEFAULT_VOLCENGINE_MODELS: ModelInfo[] = [
  { id: 'doubao-pro-32k', name: '豆包Pro 32K', capabilities: ['text'] },
  { id: 'doubao-pro-128k', name: '豆包Pro 128K', capabilities: ['text'] },
  { id: 'doubao-pro-256k', name: '豆包Pro 256K', capabilities: ['text'] },
  { id: 'doubao-lite-32k', name: '豆包Lite 32K', capabilities: ['text'] },
  { id: 'doubao-lite-128k', name: '豆包Lite 128K', capabilities: ['text'] },
  { id: 'doubao-vision-pro-32k', name: '豆包Vision Pro 32K', capabilities: ['text', 'image'] },
  { id: 'doubao-vision-lite-32k', name: '豆包Vision Lite 32K', capabilities: ['text', 'image'] },
];

// 默认模型映射
const DEFAULT_MODELS: Record<AIServiceType, ModelInfo[]> = {
  openai: DEFAULT_OPENAI_MODELS,
  claude: DEFAULT_CLAUDE_MODELS,
  gemini: DEFAULT_GEMINI_MODELS,
  qwen: DEFAULT_QWEN_MODELS,
  volcengine: DEFAULT_VOLCENGINE_MODELS,
};

// 环境变量名映射
const ENV_VAR_NAMES: Record<AIServiceType, string> = {
  openai: 'OPENAI_MODELS',
  claude: 'CLAUDE_MODELS',
  gemini: 'GEMINI_MODELS',
  qwen: 'QWEN_MODELS',
  volcengine: 'VOLCENGINE_MODELS',
};

/**
 * 获取指定服务的模型列表（优先从环境变量读取，否则使用默认值）
 */
export function getConfiguredModels(serviceType: AIServiceType): ModelInfo[] {
  const envVarName = ENV_VAR_NAMES[serviceType];
  const envValue = process.env[envVarName];

  if (envValue && envValue.trim()) {
    const customModels = parseModelListConfig(envValue);
    if (customModels.length > 0) {
      console.log(`[ModelConfig] Using custom models for ${serviceType} from ${envVarName}`);
      return customModels;
    }
  }

  // 使用默认模型列表
  return DEFAULT_MODELS[serviceType] || [];
}

/**
 * 获取所有服务的模型配置
 */
export function getAllConfiguredModels(): Record<AIServiceType, ModelInfo[]> {
  const services: AIServiceType[] = ['openai', 'claude', 'gemini', 'qwen', 'volcengine'];
  const result: Record<string, ModelInfo[]> = {};

  for (const service of services) {
    result[service] = getConfiguredModels(service);
  }

  return result as Record<AIServiceType, ModelInfo[]>;
}

/**
 * 生成模型配置字符串（用于导出配置）
 */
export function generateModelConfigString(models: ModelInfo[]): string {
  return models
    .map(m => `${m.id}:${m.name}:${m.capabilities.join(',')}`)
    .join('|');
}

/**
 * 获取默认模型列表（用于初始化或重置）
 */
export function getDefaultModels(serviceType: AIServiceType): ModelInfo[] {
  return DEFAULT_MODELS[serviceType] || [];
}
