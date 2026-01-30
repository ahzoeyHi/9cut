import type { AIServiceConfig } from '../../types';
import type { TextGenerationAdapter, TextGenerationOptions } from './adapter';
export declare class GeminiAdapter implements TextGenerationAdapter {
    type: "gemini";
    config: AIServiceConfig;
    constructor(config: AIServiceConfig);
    testConnection(): Promise<boolean>;
    generateText(prompt: string, options?: TextGenerationOptions): Promise<string>;
}
//# sourceMappingURL=gemini.d.ts.map