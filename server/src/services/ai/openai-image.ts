import type { AIServiceConfig } from '../../types';
import type {
  ImageGenerationAdapter,
  ImageGenerationOptions
} from './adapter';
import { config } from '../../config';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

export class OpenAIImageAdapter implements ImageGenerationAdapter {
  type = 'openai' as const;
  config: AIServiceConfig;

  constructor(config: AIServiceConfig) {
    this.config = config;
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.endpoint || 'https://api.openai.com/v1'}/models`, {
        headers: {
          'Authorization': `Bearer ${this.config.api_key}`
        }
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async generateImage(prompt: string, options?: ImageGenerationOptions): Promise<string> {
    const endpoint = this.config.endpoint || 'https://api.openai.com/v1';
    const model = this.config.model || 'dall-e-3';

    // 设置图片尺寸
    let size = '1024x1024';
    if (options?.width && options?.height) {
      // DALL-E 3 支持的尺寸: 1024x1024, 1024x1792, 1792x1024
      if (options.width > options.height) {
        size = '1792x1024';
      } else if (options.height > options.width) {
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

    const data = await response.json() as { data: { b64_json: string }[] };
    const imageData = data.data[0].b64_json;

    // 保存图片到本地
    const filePath = await this.saveImage(imageData);
    return filePath;
  }

  private async saveImage(base64Data: string): Promise<string> {
    const generatedDir = config.getAbsolutePath(config.storage.generatedDir);
    const imagesDir = path.join(generatedDir, 'images');

    // 确保目录存在
    if (!fs.existsSync(imagesDir)) {
      fs.mkdirSync(imagesDir, { recursive: true });
    }

    const filename = `${uuidv4()}.png`;
    const filePath = path.join(imagesDir, filename);

    // 解码base64并保存
    const buffer = Buffer.from(base64Data, 'base64');
    fs.writeFileSync(filePath, buffer);

    // 返回相对路径用于存储
    return `images/${filename}`;
  }
}
