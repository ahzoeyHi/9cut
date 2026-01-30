"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QwenAdapter = void 0;
class QwenAdapter {
    type = 'qwen';
    config;
    constructor(config) {
        this.config = config;
    }
    async testConnection() {
        try {
            const endpoint = this.config.endpoint || 'https://dashscope.aliyuncs.com/api/v1';
            const response = await fetch(`${endpoint}/services/aigc/text-generation/generation`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.config.api_key}`
                },
                body: JSON.stringify({
                    model: this.config.model || 'qwen-turbo',
                    input: {
                        messages: [{ role: 'user', content: 'test' }]
                    },
                    parameters: {
                        max_tokens: 10
                    }
                })
            });
            return response.ok;
        }
        catch {
            return false;
        }
    }
    async generateText(prompt, options) {
        const endpoint = this.config.endpoint || 'https://dashscope.aliyuncs.com/api/v1';
        const model = this.config.model || 'qwen-turbo';
        const response = await fetch(`${endpoint}/services/aigc/text-generation/generation`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.config.api_key}`
            },
            body: JSON.stringify({
                model,
                input: {
                    messages: [{ role: 'user', content: prompt }]
                },
                parameters: {
                    max_tokens: options?.maxTokens || 4096,
                    temperature: options?.temperature || 0.7,
                    top_p: options?.topP || 1
                }
            })
        });
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Qwen API error: ${response.statusText} - ${error}`);
        }
        const data = await response.json();
        return data.output.text;
    }
}
exports.QwenAdapter = QwenAdapter;
//# sourceMappingURL=qwen.js.map