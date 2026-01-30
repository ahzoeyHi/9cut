"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAIImageAdapter = void 0;
const config_1 = require("../../config");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const uuid_1 = require("uuid");
class OpenAIImageAdapter {
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
    async generateImage(prompt, options) {
        const endpoint = this.config.endpoint || 'https://api.openai.com/v1';
        const model = this.config.model || 'dall-e-3';
        // 设置图片尺寸
        let size = '1024x1024';
        if (options?.width && options?.height) {
            // DALL-E 3 支持的尺寸: 1024x1024, 1024x1792, 1792x1024
            if (options.width > options.height) {
                size = '1792x1024';
            }
            else if (options.height > options.width) {
                size = '1024x1792';
            }
        }
        const response = await fetch(`${endpoint}/images/generations`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.config.api_key}`
            },
            body: JSON.stringify({
                model,
                prompt,
                n: 1,
                size,
                quality: options?.quality || 'standard',
                response_format: 'b64_json'
            })
        });
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`OpenAI Image API error: ${response.statusText} - ${error}`);
        }
        const data = await response.json();
        const imageData = data.data[0].b64_json;
        // 保存图片到本地
        const filePath = await this.saveImage(imageData);
        return filePath;
    }
    async saveImage(base64Data) {
        const generatedDir = config_1.config.getAbsolutePath(config_1.config.storage.generatedDir);
        const imagesDir = path_1.default.join(generatedDir, 'images');
        // 确保目录存在
        if (!fs_1.default.existsSync(imagesDir)) {
            fs_1.default.mkdirSync(imagesDir, { recursive: true });
        }
        const filename = `${(0, uuid_1.v4)()}.png`;
        const filePath = path_1.default.join(imagesDir, filename);
        // 解码base64并保存
        const buffer = Buffer.from(base64Data, 'base64');
        fs_1.default.writeFileSync(filePath, buffer);
        // 返回相对路径用于存储
        return `images/${filename}`;
    }
}
exports.OpenAIImageAdapter = OpenAIImageAdapter;
//# sourceMappingURL=openai-image.js.map