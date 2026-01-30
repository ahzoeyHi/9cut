"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClaudeAdapter = void 0;
class ClaudeAdapter {
    type = 'claude';
    config;
    constructor(config) {
        this.config = config;
    }
    async testConnection() {
        try {
            const response = await fetch(`${this.config.endpoint || 'https://api.anthropic.com'}/v1/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.config.api_key,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: this.config.model,
                    max_tokens: 10,
                    messages: [{ role: 'user', content: 'test' }]
                })
            });
            return response.ok;
        }
        catch {
            return false;
        }
    }
    async generateText(prompt, options) {
        const endpoint = this.config.endpoint || 'https://api.anthropic.com';
        const response = await fetch(`${endpoint}/v1/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.config.api_key,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: this.config.model,
                max_tokens: options?.maxTokens || 4096,
                messages: [{ role: 'user', content: prompt }]
            })
        });
        if (!response.ok) {
            throw new Error(`Claude API error: ${response.statusText}`);
        }
        const data = await response.json();
        return data.content[0].text;
    }
}
exports.ClaudeAdapter = ClaudeAdapter;
//# sourceMappingURL=claude.js.map