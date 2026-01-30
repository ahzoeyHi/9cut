import type { AIServiceConfig } from '../../types';
import type { SpeechSynthesisAdapter, SpeechOptions } from './adapter';
export declare class OpenAITTSAdapter implements SpeechSynthesisAdapter {
    type: "openai";
    config: AIServiceConfig;
    constructor(config: AIServiceConfig);
    testConnection(): Promise<boolean>;
    synthesizeSpeech(text: string, options?: SpeechOptions): Promise<Buffer>;
}
//# sourceMappingURL=openai-tts.d.ts.map