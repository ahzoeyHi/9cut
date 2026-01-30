"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAITTSAdapter = void 0;
class OpenAITTSAdapter {
    type = 'openai';
    config;
    constructor(config) {
        this.config = config;
    }
    async testConnection() {
        try {
            const response = await fetch(`${this.config.endpoint || 'https://api.openai.com/v1'}/models`, {
                headers: {
                    'Authorization': `Bearer ${this.config.api_key}`
                }
            });
            return response.ok;
        }
        catch {
            return false;
        }
    }
    async synthesizeSpeech(text, options) {
        const endpoint = this.config.endpoint || 'https://api.openai.com/v1';
        const model = this.config.model || 'tts-1';
        // OpenAI TTS 支持的语音角色
        // alloy, echo, fable, onyx, nova, shimmer
        const voice = options?.voiceId || 'alloy';
        const speed = options?.speed || 1.0;
        const response = await fetch(`${endpoint}/audio/speech`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.config.api_key}`
            },
            body: JSON.stringify({
                model,
                input: text,
                voice,
                speed: Math.max(0.25, Math.min(4.0, speed)), // OpenAI 支持 0.25 到 4.0
                response_format: options?.format || 'mp3'
            })
        });
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`OpenAI TTS API error: ${response.statusText} - ${error}`);
        }
        // 获取音频数据
        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
    }
}
exports.OpenAITTSAdapter = OpenAITTSAdapter;
//# sourceMappingURL=openai-tts.js.map