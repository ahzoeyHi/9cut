import type { AIServiceConfig } from '../../types';
import type { TextGenerationAdapter, TextGenerationOptions } from './adapter';
export declare class OpenAIAdapter implements TextGenerationAdapter {
    type: "openai";
    config: AIServiceConfig;
    constructor(config: AIServiceConfig);
    testConnection(): Promise<boolean>;
    generateText(prompt: string, options?: TextGenerationOptions): Promise<string>;
}
//# sourceMappingURL=openai.d.ts.map