import type { AIServiceConfig } from '../../types';
import type { ImageGenerationAdapter, ImageGenerationOptions } from './adapter';
export declare class OpenAIImageAdapter implements ImageGenerationAdapter {
    type: "openai";
    config: AIServiceConfig;
    constructor(config: AIServiceConfig);
    testConnection(): Promise<boolean>;
    generateImage(prompt: string, options?: ImageGenerationOptions): Promise<string>;
    private saveImage;
}
//# sourceMappingURL=openai-image.d.ts.map