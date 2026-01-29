import type { AIServiceConfig } from '../../types';
import type {
  TextGenerationAdapter,
  TextGenerationOptions
} from './adapter';

export class ClaudeAdapter implements TextGenerationAdapter {
  type = 'claude' as const;
  config: AIServiceConfig;

  constructor(config: AIServiceConfig) {
    this.config = config;
  }

  async testConnection(): Promise<boolean> {
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
    } catch {
      return false;
    }
  }

  async generateText(prompt: string, options?: TextGenerationOptions): Promise<string> {
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

    const data = await response.json() as { content: { text: string }[] };
    return data.content[0].text;
  }
}
