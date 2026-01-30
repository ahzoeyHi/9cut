"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeminiAdapter = void 0;
class GeminiAdapter {
    type = 'gemini';
    config;
    constructor(config) {
        this.config = config;
    }
    async testConnection() {
        try {
            const endpoint = this.config.endpoint || 'https://generativelanguage.googleapis.com/v1beta';
            const response = await fetch(`${endpoint}/models?key=${this.config.api_key}`);
            return response.ok;
        }
        catch {
            return false;
        }
    }
    async generateText(prompt, options) {
        const endpoint = this.config.endpoint || 'https://generativelanguage.googleapis.com/v1beta';
        const model = this.config.model || 'gemini-pro';
        const response = await fetch(`${endpoint}/models/${model}:generateContent?key=${this.config.api_key}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                        parts: [{ text: prompt }]
                    }],
                generationConfig: {
                    maxOutputTokens: options?.maxTokens || 4096,
                    temperature: options?.temperature || 0.7,
                    topP: options?.topP || 1
                }
            })
        });
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Gemini API error: ${response.statusText} - ${error}`);
        }
        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    }
}
exports.GeminiAdapter = GeminiAdapter;
//# sourceMappingURL=gemini.js.map