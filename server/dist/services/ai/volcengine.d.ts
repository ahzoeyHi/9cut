import type { AIServiceConfig } from '../../types';
import type { TextGenerationAdapter, TextGenerationOptions } from './adapter';
export declare class VolcengineAdapter implements TextGenerationAdapter {
    type: "volcengine";
    config: AIServiceConfig;
    constructor(config: AIServiceConfig);
    testConnection(): Promise<boolean>;
    generateText(prompt: string, options?: TextGenerationOptions): Promise<string>;
}
//# sourceMappingURL=volcengine.d.ts.map