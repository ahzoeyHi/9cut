import type { AIServiceConfig } from '../../types';
import type {
  TextGenerationAdapter,
  TextGenerationOptions
} from './adapter';

export class QwenAdapter implements TextGenerationAdapter {
  type = 'qwen' as const;
  config: AIServiceConfig;

  constructor(config: AIServiceConfig) {
    this.config = config;
  }

  async testConnection(): Promise<boolean> {
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
    } catch {
      return false;
    }
  }

  async generateText(prompt: string, options?: TextGenerationOptions): Promise<string> {
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

    const data = await response.json() as {
      output: { text: string }
    };

    return data.output.text;
  }
}
