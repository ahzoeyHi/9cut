"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConfiguredModels = getConfiguredModels;
exports.getAllConfiguredModels = getAllConfiguredModels;
exports.generateModelConfigString = generateModelConfigString;
exports.getDefaultModels = getDefaultModels;
// 模型配置格式: "模型ID:显示名称:能力1,能力2"
// 例如: "gpt-4o:GPT-4o:text,image" 或 "gpt-4o::text" (名称留空则使用ID)
/**
 * 解析单个模型配置字符串
 */
function parseModelConfig(config) {
    const parts = config.split(':');
    if (parts.length < 2)
        return null;
    const id = parts[0].trim();
    if (!id)
        return null;
    const name = parts[1]?.trim() || id;
    const capabilitiesStr = parts[2]?.trim() || 'text';
    const capabilities = capabilitiesStr.split(',').map(c => c.trim());
    return { id, name, capabilities };
}
/**
 * 解析模型列表配置字符串
 * 格式: "模型1|模型2|模型3" 每个模型格式为 "ID:名称:能力1,能力2"
 */
function parseModelListConfig(configStr) {
    if (!configStr || !configStr.trim())
        return [];
    return configStr
        .split('|')
        .map(c => parseModelConfig(c.trim()))
        .filter((m) => m !== null);
}
// ==========================================
// 默认模型列表（硬编码作为备选）
// ==========================================
const DEFAULT_OPENAI_MODELS = [
    { id: 'gpt-4o', name: 'GPT-4o', capabilities: ['text', 'image'] },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini', capabilities: ['text', 'image'] },
    { id: 'gpt-oss-120b-medium', name: 'GPT-OSS-120B-Medium', capabilities: ['text'] },
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
const DEFAULT_CLAUDE_MODELS = [
    { id: 'gemini-claude-sonnet-4-5', name: 'Gemini Claude Sonnet 4.5', capabilities: ['text'] },
    { id: 'gemini-claude-opus-4-5-thinking', name: 'Gemini Claude Opus 4.5 Thinking', capabilities: ['text'] },
    { id: 'gemini-claude-sonnet-4-5-thinking', name: 'Gemini Claude Sonnet 4.5 Thinking', capabilities: ['text'] },
    { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', capabilities: ['text'] },
    { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', capabilities: ['text'] },
    { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', capabilities: ['text'] },
    { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', capabilities: ['text'] },
    { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet', capabilities: ['text'] },
    { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', capabilities: ['text'] },
];
const DEFAULT_GEMINI_MODELS = [
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', capabilities: ['text', 'image'] },
    { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite', capabilities: ['text'] },
    { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash Preview', capabilities: ['text', 'image'] },
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', capabilities: ['text', 'image'] },
    { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro Preview', capabilities: ['text', 'image'] },
    { id: 'gemini-3-pro-image-preview', name: 'Gemini 3 Pro Image Preview', capabilities: ['image'] },
    { id: 'gemini-2.5-pro-preview-05-06', name: 'Gemini 2.5 Pro Preview', capabilities: ['text', 'image'] },
    { id: 'gemini-2.5-flash-preview-05-20', name: 'Gemini 2.5 Flash Preview', capabilities: ['text', 'image'] },
    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', capabilities: ['text', 'image'] },
    { id: 'gemini-2.0-flash-lite', name: 'Gemini 2.0 Flash Lite', capabilities: ['text'] },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', capabilities: ['text'] },
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', capabilities: ['text'] },
    { id: 'imagen-3.0-generate-002', name: 'Imagen 3', capabilities: ['image'] },
];
const DEFAULT_QWEN_MODELS = [
    { id: 'qwen3-coder-plus', name: 'Qwen3 Coder Plus', capabilities: ['text'] },
    { id: 'qwen3-235b', name: 'Qwen3 235B', capabilities: ['text'] },
    { id: 'qwen3-235b-a22b-thinking-2507', name: 'Qwen3 235B A22B Thinking', capabilities: ['text'] },
    { id: 'qwen3-vl-plus', name: 'Qwen3 VL Plus', capabilities: ['text', 'image'] },
    { id: 'qwen3-32b', name: 'Qwen3 32B', capabilities: ['text'] },
    { id: 'qwen3-coder-flash', name: 'Qwen3 Coder Flash', capabilities: ['text'] },
    { id: 'qwen3-max', name: 'Qwen3 Max', capabilities: ['text'] },
    { id: 'qwen3-max-preview', name: 'Qwen3 Max Preview', capabilities: ['text'] },
    { id: 'qwen3-235b-a22b-instruct', name: 'Qwen3 235B A22B Instruct', capabilities: ['text'] },
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
const DEFAULT_VOLCENGINE_MODELS = [
    { id: 'doubao-pro-32k', name: '豆包Pro 32K', capabilities: ['text'] },
    { id: 'doubao-pro-128k', name: '豆包Pro 128K', capabilities: ['text'] },
    { id: 'doubao-pro-256k', name: '豆包Pro 256K', capabilities: ['text'] },
    { id: 'doubao-lite-32k', name: '豆包Lite 32K', capabilities: ['text'] },
    { id: 'doubao-lite-128k', name: '豆包Lite 128K', capabilities: ['text'] },
    { id: 'doubao-vision-pro-32k', name: '豆包Vision Pro 32K', capabilities: ['text', 'image'] },
    { id: 'doubao-vision-lite-32k', name: '豆包Vision Lite 32K', capabilities: ['text', 'image'] },
];
const DEFAULT_KIMI_MODELS = [
    { id: 'kimi-k2-thinking', name: 'Kimi K2 Thinking', capabilities: ['text'] },
    { id: 'kimi-k2-0905', name: 'Kimi K2 0905', capabilities: ['text'] },
    { id: 'kimi-k2', name: 'Kimi K2', capabilities: ['text'] },
];
const DEFAULT_GLM_MODELS = [
    { id: 'glm-4.6', name: 'GLM-4.6', capabilities: ['text'] },
    { id: 'glm-4.7', name: 'GLM-4.7', capabilities: ['text'] },
];
const DEFAULT_DEEPSEEK_MODELS = [
    { id: 'deepseek-v3.2-reasoner', name: 'DeepSeek v3.2 Reasoner', capabilities: ['text'] },
    { id: 'deepseek-v3.1', name: 'DeepSeek v3.1', capabilities: ['text'] },
    { id: 'deepseek-v3', name: 'DeepSeek v3', capabilities: ['text'] },
    { id: 'deepseek-v3.2-chat', name: 'DeepSeek v3.2 Chat', capabilities: ['text'] },
    { id: 'deepseek-v3.2', name: 'DeepSeek v3.2', capabilities: ['text'] },
    { id: 'deepseek-r1', name: 'DeepSeek R1', capabilities: ['text'] },
];
// 默认模型映射
const DEFAULT_MODELS = {
    openai: DEFAULT_OPENAI_MODELS,
    claude: DEFAULT_CLAUDE_MODELS,
    gemini: DEFAULT_GEMINI_MODELS,
    qwen: DEFAULT_QWEN_MODELS,
    volcengine: DEFAULT_VOLCENGINE_MODELS,
    kimi: DEFAULT_KIMI_MODELS,
    glm: DEFAULT_GLM_MODELS,
    deepseek: DEFAULT_DEEPSEEK_MODELS,
};
// 环境变量名映射
const ENV_VAR_NAMES = {
    openai: 'OPENAI_MODELS',
    claude: 'CLAUDE_MODELS',
    gemini: 'GEMINI_MODELS',
    qwen: 'QWEN_MODELS',
    volcengine: 'VOLCENGINE_MODELS',
    kimi: 'KIMI_MODELS',
    glm: 'GLM_MODELS',
    deepseek: 'DEEPSEEK_MODELS',
};
/**
 * 获取指定服务的模型列表（优先从环境变量读取，否则使用默认值）
 */
function getConfiguredModels(serviceType) {
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
function getAllConfiguredModels() {
    const services = ['openai', 'claude', 'gemini', 'qwen', 'volcengine', 'kimi', 'glm', 'deepseek'];
    const result = {};
    for (const service of services) {
        result[service] = getConfiguredModels(service);
    }
    return result;
}
/**
 * 生成模型配置字符串（用于导出配置）
 */
function generateModelConfigString(models) {
    return models
        .map(m => `${m.id}:${m.name}:${m.capabilities.join(',')}`)
        .join('|');
}
/**
 * 获取默认模型列表（用于初始化或重置）
 */
function getDefaultModels(serviceType) {
    return DEFAULT_MODELS[serviceType] || [];
}
//# sourceMappingURL=modelConfig.js.map