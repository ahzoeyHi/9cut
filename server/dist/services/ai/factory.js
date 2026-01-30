"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIAdapterFactory = void 0;
const openai_1 = require("./openai");
const claude_1 = require("./claude");
const gemini_1 = require("./gemini");
const qwen_1 = require("./qwen");
const volcengine_1 = require("./volcengine");
const openai_image_1 = require("./openai-image");
const openai_tts_1 = require("./openai-tts");
const config_1 = require("../../models/config");
class AIAdapterFactory {
    static createTextAdapter(config) {
        switch (config.service_type) {
            case 'openai':
                return new openai_1.OpenAIAdapter(config);
            case 'claude':
                return new claude_1.ClaudeAdapter(config);
            case 'gemini':
                return new gemini_1.GeminiAdapter(config);
            case 'qwen':
                return new qwen_1.QwenAdapter(config);
            case 'volcengine':
                return new volcengine_1.VolcengineAdapter(config);
            default:
                throw new Error(`Unsupported service type: ${config.service_type}`);
        }
    }
    static createImageAdapter(config) {
        switch (config.service_type) {
            case 'openai':
                return new openai_image_1.OpenAIImageAdapter(config);
            default:
                throw new Error(`Unsupported image service type: ${config.service_type}`);
        }
    }
    static createSpeechAdapter(config) {
        switch (config.service_type) {
            case 'openai':
                return new openai_tts_1.OpenAITTSAdapter(config);
            default:
                throw new Error(`Unsupported speech service type: ${config.service_type}`);
        }
    }
    static createVideoAdapter(_config) {
        // TODO: 实现视频生成适配器
        throw new Error('Video adapter not implemented yet');
    }
    // 根据功能类型获取对应的适配器
    static getAdapterForFunction(functionType) {
        const config = config_1.aiServiceConfigModel.findActiveByFunction(functionType);
        if (!config) {
            throw new Error(`No active AI service configured for function: ${functionType}`);
        }
        switch (functionType) {
            case 'storyboard':
            case 'narration':
                return this.createTextAdapter(config);
            case 'image':
                return this.createImageAdapter(config);
            case 'speech':
                return this.createSpeechAdapter(config);
            case 'video':
                return this.createVideoAdapter(config);
            default:
                throw new Error(`Unknown function type: ${functionType}`);
        }
    }
}
exports.AIAdapterFactory = AIAdapterFactory;
//# sourceMappingURL=factory.js.map