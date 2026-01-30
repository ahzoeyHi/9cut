import type { AIServiceConfig, AIServiceType } from '../../types';
export interface TextGenerationOptions {
    maxTokens?: number;
    temperature?: number;
    topP?: number;
}
export interface ImageGenerationOptions {
    width?: number;
    height?: number;
    quality?: 'standard' | 'hd';
    style?: string;
}
export interface SpeechOptions {
    voiceId?: string;
    speed?: number;
    pitch?: number;
    format?: 'mp3' | 'wav' | 'ogg';
}
export interface VideoGenerationOptions {
    duration?: number;
    fps?: number;
    transition?: 'fade' | 'zoom' | 'pan';
}
export interface AIAdapter {
    type: AIServiceType;
    config: AIServiceConfig;
    testConnection(): Promise<boolean>;
}
export interface TextGenerationAdapter extends AIAdapter {
    generateText(prompt: string, options?: TextGenerationOptions): Promise<string>;
}
export interface ImageGenerationAdapter extends AIAdapter {
    generateImage(prompt: string, options?: ImageGenerationOptions): Promise<string>;
}
export interface SpeechSynthesisAdapter extends AIAdapter {
    synthesizeSpeech(text: string, options?: SpeechOptions): Promise<Buffer>;
}
export interface VideoGenerationAdapter extends AIAdapter {
    generateVideo(firstFrame: string, lastFrame: string, options?: VideoGenerationOptions): Promise<string>;
}
export interface GeneratedStoryboard {
    sequence: number;
    sceneDescription: string;
    visualDescription: string;
    duration: number;
    narration?: string;
}
//# sourceMappingURL=adapter.d.ts.map