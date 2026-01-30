"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VolcengineAdapter = void 0;
class VolcengineAdapter {
    type = 'volcengine';
    config;
    constructor(config) {
        this.config = config;
    }
    async testConnection() {
        try {
            const endpoint = this.config.endpoint || 'https://ark.cn-beijing.volces.com/api/v3';
            const response = await fetch(`${endpoint}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.config.api_key}`
                },
                body: JSON.stringify({
                    model: this.config.model,
                    messages: [{ role: 'user', content: 'test' }],
                    max_tokens: 10
                })
            });
            return response.ok;
        }
        catch {
            return false;
        }
    }
    async generateText(prompt, options) {
        const endpoint = this.config.endpoint || 'https://ark.cn-beijing.volces.com/api/v3';
        const model = this.config.model;
        if (!model) {
            throw new Error('Volcengine requires a model endpoint ID');
        }
        const response = await fetch(`${endpoint}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.config.api_key}`
            },
            body: JSON.stringify({
                model,
                messages: [{ role: 'user', content: prompt }],
                max_tokens: options?.maxTokens || 4096,
                temperature: options?.temperature || 0.7,
                top_p: options?.topP || 1
            })
        });
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Volcengine API error: ${response.statusText} - ${error}`);
        }
        const data = await response.json();
        return data.choices[0].message.content;
    }
}
exports.VolcengineAdapter = VolcengineAdapter;
//# sourceMappingURL=volcengine.js.map