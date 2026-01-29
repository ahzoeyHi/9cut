import type { AIServiceConfig, AIServiceType } from '../../types';

// 文本生成选项
export interface TextGenerationOptions {
  maxTokens?: number;
  temperature?: number;
  topP?: number;
}

// 图片生成选项
export interface ImageGenerationOptions {
  width?: number;
  height?: number;
  quality?: 'standard' | 'hd';
  style?: string;
}

// 语音合成选项
export interface SpeechOptions {
  voiceId?: string;
  speed?: number;
  pitch?: number;
  format?: 'mp3' | 'wav' | 'ogg';
}

// 视频生成选项
export interface VideoGenerationOptions {
  duration?: number;
  fps?: number;
  transition?: 'fade' | 'zoom' | 'pan';
}

// 基础适配器接口
export interface AIAdapter {
  type: AIServiceType;
  config: AIServiceConfig;
  testConnection(): Promise<boolean>;
}

// 文本生成适配器
export interface TextGenerationAdapter extends AIAdapter {
  generateText(prompt: string, options?: TextGenerationOptions): Promise<string>;
}

// 图片生成适配器
export interface ImageGenerationAdapter extends AIAdapter {
  generateImage(prompt: string, options?: ImageGenerationOptions): Promise<string>;
}

// 语音合成适配器
export interface SpeechSynthesisAdapter extends AIAdapter {
  synthesizeSpeech(text: string, options?: SpeechOptions): Promise<Buffer>;
}

// 视频生成适配器
export interface VideoGenerationAdapter extends AIAdapter {
  generateVideo(
    firstFrame: string,
    lastFrame: string,
    options?: VideoGenerationOptions
  ): Promise<string>;
}

// 分镜数据结构
export interface GeneratedStoryboard {
  sequence: number;
  sceneDescription: string;
  visualDescription: string;
  duration: number;
  narration?: string;
}
