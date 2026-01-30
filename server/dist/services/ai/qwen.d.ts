import type { AIServiceConfig } from '../../types';
import type { TextGenerationAdapter, TextGenerationOptions } from './adapter';
export declare class QwenAdapter implements TextGenerationAdapter {
    type: "qwen";
    config: AIServiceConfig;
    constructor(config: AIServiceConfig);
    testConnection(): Promise<boolean>;
    generateText(prompt: string, options?: TextGenerationOptions): Promise<string>;
}
//# sourceMappingURL=qwen.d.ts.map