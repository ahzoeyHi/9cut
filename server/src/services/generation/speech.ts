import { storyboardModel } from '../../models/storyboard';
import { resourceModel } from '../../models/resource';
import { taskModel } from '../../models/task';
import { AIAdapterFactory } from '../ai/factory';
import type { SpeechSynthesisAdapter } from '../ai/adapter';
import { config } from '../../config';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

/**
 * 生成语音
 */
export async function generateSpeech(
  storyboardId: string,
  taskId: string,
  options?: { voiceId?: string; speed?: number }
): Promise<void> {
  try {
    taskModel.update(taskId, { status: 'processing', progress: 10 });

    // 获取分镜信息
    const storyboard = storyboardModel.findById(storyboardId);
    if (!storyboard) {
      throw new Error('分镜不存在');
    }

    // 检查口播文案
    if (!storyboard.narration) {
      throw new Error('分镜没有口播文案，请先生成或输入口播文案');
    }

    taskModel.update(taskId, { progress: 20 });

    // 更新分镜状态
    storyboardModel.update(storyboardId, { status: 'generating' });

    // 获取AI适配器
    let adapter: SpeechSynthesisAdapter;
    try {
      adapter = AIAdapterFactory.getAdapterForFunction('speech') as SpeechSynthesisAdapter;
    } catch {
      // 如果没有配置TTS服务，使用模拟数据
      console.log('No TTS service configured, using mock data');
      await generateMockSpeech(storyboardId, taskId);
      return;
    }

    taskModel.update(taskId, { progress: 40 });

    // 调用TTS服务
    const audioBuffer = await adapter.synthesizeSpeech(storyboard.narration, {
      voiceId: options?.voiceId,
      speed: options?.speed || 1.0,
      format: 'mp3'
    });

    taskModel.update(taskId, { progress: 70 });

    // 保存音频文件
    const generatedDir = config.getAbsolutePath(config.storage.generatedDir);
    const audioDir = path.join(generatedDir, 'audio');
    if (!fs.existsSync(audioDir)) {
      fs.mkdirSync(audioDir, { recursive: true });
    }

    const filename = `${uuidv4()}.mp3`;
    const filePath = path.join(audioDir, filename);
    fs.writeFileSync(filePath, audioBuffer);

    taskModel.update(taskId, { progress: 80 });

    // 创建资源记录
    const stats = fs.statSync(filePath);
    const resource = resourceModel.create({
      type: 'audio',
      subtype: 'speech',
      file_path: `audio/${filename}`,
      file_size: stats.size,
      mime_type: 'audio/mpeg',
      storyboard_id: storyboardId,
      project_id: storyboard.project_id,
      metadata: {
        text: storyboard.narration,
        voiceId: options?.voiceId,
        speed: options?.speed,
        generatedAt: new Date().toISOString()
      }
    });

    // 关联资源到分镜
    resourceModel.linkToStoryboard(storyboardId, resource.id, 'speech');

    taskModel.update(taskId, { progress: 90 });

    // 更新分镜状态
    storyboardModel.update(storyboardId, { status: 'completed' });

    // 完成任务
    taskModel.update(taskId, {
      status: 'completed',
      progress: 100,
      result: {
        resourceId: resource.id,
        audioPath: `audio/${filename}`
      }
    });

  } catch (error) {
    console.error('Error generating speech:', error);

    storyboardModel.update(storyboardId, { status: 'error' });

    taskModel.update(taskId, {
      status: 'failed',
      error: error instanceof Error ? error.message : '语音生成失败'
    });
  }
}

/**
 * 生成模拟语音（用于测试）
 */
async function generateMockSpeech(
  storyboardId: string,
  taskId: string
): Promise<void> {
  const storyboard = storyboardModel.findById(storyboardId);
  if (!storyboard) {
    throw new Error('分镜不存在');
  }

  // 模拟延迟
  await new Promise(resolve => setTimeout(resolve, 500));

  // 创建模拟资源记录
  const mockPath = 'audio/placeholder.mp3';

  const resource = resourceModel.create({
    type: 'audio',
    subtype: 'speech',
    file_path: mockPath,
    storyboard_id: storyboardId,
    project_id: storyboard.project_id,
    metadata: {
      mock: true,
      text: storyboard.narration,
      generatedAt: new Date().toISOString()
    }
  });

  // 关联资源
  resourceModel.linkToStoryboard(storyboardId, resource.id, 'speech');

  // 更新分镜状态
  storyboardModel.update(storyboardId, { status: 'completed' });

  taskModel.update(taskId, {
    status: 'completed',
    progress: 100,
    result: {
      resourceId: resource.id,
      audioPath: mockPath,
      mock: true
    }
  });
}
