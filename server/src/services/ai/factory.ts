import type { AIServiceConfig, FunctionType } from '../../types';
import type {
  TextGenerationAdapter,
  ImageGenerationAdapter,
  SpeechSynthesisAdapter,
  VideoGenerationAdapter
} from './adapter';
import { OpenAIAdapter } from './openai';
import { ClaudeAdapter } from './claude';
import { GeminiAdapter } from './gemini'; 
import { QwenAdapter } from './qwen';
import { VolcengineAdapter } from './volcengine';
import { OpenAIImageAdapter } from './openai-image';
import { OpenAITTSAdapter } from './openai-tts';
import { aiServiceConfigModel } from '../../models/config';

export class AIAdapterFactory {
  static createTextAdapter(config: AIServiceConfig): TextGenerationAdapter {
    switch (config.service_type) {
      case 'openai':
        return new OpenAIAdapter(config);
      case 'claude':
        return new ClaudeAdapter(config);
      case 'gemini':
        return new GeminiAdapter(config);
      case 'qwen':
        return new QwenAdapter(config);
      case 'volcengine':
        return new VolcengineAdapter(config);
      default:
        throw new Error(`Unsupported service type: ${config.service_type}`);
    }
  }

  static createImageAdapter(config: AIServiceConfig): ImageGenerationAdapter {
    switch (config.service_type) {
      case 'openai':
        return new OpenAIImageAdapter(config);
      default:
        throw new Error(`Unsupported image service type: ${config.service_type}`);
    }
  }

  static createSpeechAdapter(config: AIServiceConfig): SpeechSynthesisAdapter {
    switch (config.service_type) {
      case 'openai':
        return new OpenAITTSAdapter(config);
      default:
        throw new Error(`Unsupported speech service type: ${config.service_type}`);
    }
  }

  static createVideoAdapter(_config: AIServiceConfig): VideoGenerationAdapter {
    // TODO: 实现视频生成适配器
    throw new Error('Video adapter not implemented yet');
  }

  // 根据功能类型获取对应的适配器
  static getAdapterForFunction(functionType: FunctionType): TextGenerationAdapter | ImageGenerationAdapter | SpeechSynthesisAdapter | VideoGenerationAdapter {
    const config = aiServiceConfigModel.findActiveByFunction(functionType);

    if (!config) {
      throw new Error(`No active AI service configured for function: ${functionType}`);
    }

    switch (functionType) {
      case 'storyboard':
      case 'narration':
        return this.createTextAdapter(config);
      case 'image':
        return this.createImageAdapter(config);
      case 'speech':
        return this.createSpeechAdapter(config);
      case 'video':
        return this.createVideoAdapter(config);
      default:
        throw new Error(`Unknown function type: ${functionType}`);
    }
  }
}
