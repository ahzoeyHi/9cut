import type { AIServiceConfig } from '../../types';
import type {
  TextGenerationAdapter,
  TextGenerationOptions
} from './adapter';

export class OpenAIAdapter implements TextGenerationAdapter {
  type = 'openai' as const;
  config: AIServiceConfig;

  constructor(config: AIServiceConfig) {
    this.config = config;
  }

  async testConnection(): Promise<boolean> {
    try {
      // 简单的测试请求
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

  async generateText(prompt: string, options?: TextGenerationOptions): Promise<string> {
    const endpoint = this.config.endpoint || 'https://api.openai.com/v1';

    const response = await fetch(`${endpoint}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.api_key}`
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: options?.maxTokens || 4096,
        temperature: options?.temperature || 0.7,
        top_p: options?.topP || 1
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }
}
