import type { AIServiceConfig } from '../../types';
import type { TextGenerationAdapter, TextGenerationOptions } from './adapter';
export declare class ClaudeAdapter implements TextGenerationAdapter {
    type: "claude";
    config: AIServiceConfig;
    constructor(config: AIServiceConfig);
    testConnection(): Promise<boolean>;
    generateText(prompt: string, options?: TextGenerationOptions): Promise<string>;
}
//# sourceMappingURL=claude.d.ts.map