import type { AIServiceConfig, FunctionType } from '../../types';
import type {
  TextGenerationAdapter,
  ImageGenerationAdapter,
  SpeechSynthesisAdapter,
  VideoGenerationAdapter
} from './adapter';
import { OpenAIAdapter } from './openai';
import { ClaudeAdapter } from './claude';
import { aiServiceConfigModel } from '../../models/config';

export class AIAdapterFactory {
  static createTextAdapter(config: AIServiceConfig): TextGenerationAdapter {
    switch (config.service_type) {
      case 'openai':
        return new OpenAIAdapter(config);
      case 'claude':
        return new ClaudeAdapter(config);
      case 'gemini':
        // TODO: 实现Gemini适配器
        throw new Error('Gemini adapter not implemented yet');
      case 'qwen':
        // TODO: 实现千问适配器
        throw new Error('Qwen adapter not implemented yet');
      case 'volcengine':
        // TODO: 实现火山引擎适配器
        throw new Error('Volcengine adapter not implemented yet');
      default:
        throw new Error(`Unsupported service type: ${config.service_type}`);
    }
  }

  static createImageAdapter(_config: AIServiceConfig): ImageGenerationAdapter {
    // TODO: 实现图片生成适配器
    throw new Error('Image adapter not implemented yet');
  }

  static createSpeechAdapter(_config: AIServiceConfig): SpeechSynthesisAdapter {
    // TODO: 实现语音合成适配器
    throw new Error('Speech adapter not implemented yet');
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
