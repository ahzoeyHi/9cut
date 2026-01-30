import type { AIServiceConfig, FunctionType } from '../../types';
import type { TextGenerationAdapter, ImageGenerationAdapter, SpeechSynthesisAdapter, VideoGenerationAdapter } from './adapter';
export declare class AIAdapterFactory {
    static createTextAdapter(config: AIServiceConfig): TextGenerationAdapter;
    static createImageAdapter(config: AIServiceConfig): ImageGenerationAdapter;
    static createSpeechAdapter(config: AIServiceConfig): SpeechSynthesisAdapter;
    static createVideoAdapter(_config: AIServiceConfig): VideoGenerationAdapter;
    static getAdapterForFunction(functionType: FunctionType): TextGenerationAdapter | ImageGenerationAdapter | SpeechSynthesisAdapter | VideoGenerationAdapter;
}
//# sourceMappingURL=factory.d.ts.map