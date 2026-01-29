import {
  generationSessionModel,
  generationMessageModel,
  type GenerationSession,
  type GenerationMessage,
  type GenerationSessionType
} from '../../models/generationSession';
import { storyboardModel } from '../../models/storyboard';
import { AIAdapterFactory } from '../ai/factory';
import type { TextGenerationAdapter, ImageGenerationAdapter } from '../ai/adapter';

// 各类型的系统提示词
const SYSTEM_PROMPTS: Record<GenerationSessionType, string> = {
  storyboard: `你是一个专业的视频分镜脚本编辑助手。你的任务是根据用户的需求修改分镜内容。

当前分镜信息会在对话中提供。请根据用户的修改要求：
1. 调整场景描述，使其更加生动具体
2. 优化画面说明，确保能准确指导图片生成
3. 调整时长以匹配内容节奏
4. 优化口播文案，使其更加口语化

请以JSON格式返回修改后的分镜信息：
{
  "sceneDescription": "场景描述",
  "visualDescription": "画面说明",
  "duration": 3000,
  "narration": "口播文案"
}`,

  image: `你是一个专业的AI图片生成提示词优化师。你的任务是根据用户的需求优化图片生成提示词。

当前分镜和已生成的图片信息会在对话中提供。请根据用户的修改要求：
1. 调整画面构图和元素
2. 修改色调和风格
3. 添加或移除特定元素
4. 调整图片的情绪和氛围

请返回优化后的图片生成提示词，直接输出提示词内容，不需要其他解释。`,

  video: `你是一个专业的视频生成参数优化师。你的任务是根据用户的需求调整视频生成参数。

当前分镜和视频信息会在对话中提供。请根据用户的修改要求：
1. 调整过渡效果（淡入淡出、缩放、平移等）
2. 修改视频时长和节奏
3. 调整画面动画效果

请以JSON格式返回优化后的视频参数：
{
  "transition": "fade|zoom|pan",
  "duration": 3000,
  "effect": "效果描述"
}`,

  speech: `你是一个专业的语音合成参数优化师。你的任务是根据用户的需求调整语音合成参数。

当前口播文案会在对话中提供。请根据用户的修改要求：
1. 调整语速（0.5-2.0）
2. 调整音调
3. 修改口播文案使其更适合朗读

请以JSON格式返回优化后的语音参数和文案：
{
  "text": "优化后的口播文案",
  "speed": 1.0,
  "pitch": 1.0
}`
};

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/**
 * 创建新的生成会话
 */
export function createGenerationSession(
  type: GenerationSessionType,
  projectId: string,
  storyboardId?: string,
  title?: string
): GenerationSession {
  return generationSessionModel.create({
    type,
    project_id: projectId,
    storyboard_id: storyboardId,
    title
  });
}

/**
 * 获取会话历史消息并转换为聊天格式
 */
function getSessionMessages(sessionId: string): ChatMessage[] {
  const messages = generationMessageModel.findBySessionId(sessionId);
  return messages.map(msg => ({
    role: msg.role,
    content: msg.content
  }));
}

/**
 * 构建上下文信息
 */
function buildContext(session: GenerationSession): string {
  let context = '';

  if (session.storyboard_id) {
    const storyboard = storyboardModel.findById(session.storyboard_id);
    if (storyboard) {
      context = `当前分镜信息：
- 序号: ${storyboard.sequence + 1}
- 场景描述: ${storyboard.scene_description || '未设置'}
- 画面说明: ${storyboard.visual_description || '未设置'}
- 时长: ${storyboard.duration}毫秒
- 口播文案: ${storyboard.narration || '未设置'}
- 状态: ${storyboard.status}`;

      if (storyboard.first_frame_url) {
        context += `\n- 首帧图片: 已生成`;
      }
      if (storyboard.last_frame_url) {
        context += `\n- 尾帧图片: 已生成`;
      }
      if (storyboard.video_url) {
        context += `\n- 视频: 已生成`;
      }
    }
  }

  if (session.current_result) {
    context += `\n\n上次修改结果：${session.current_result}`;
  }

  return context;
}

/**
 * 发送消息并获取AI回复
 */
export async function sendGenerationMessage(
  sessionId: string,
  userMessage: string
): Promise<{ message: GenerationMessage; result?: string }> {
  const session = generationSessionModel.findById(sessionId);
  if (!session) {
    throw new Error('会话不存在');
  }

  // 保存用户消息
  generationMessageModel.create({
    session_id: sessionId,
    role: 'user',
    content: userMessage
  });

  // 获取历史消息
  const historyMessages = getSessionMessages(sessionId);

  // 构建上下文
  const context = buildContext(session);
  const systemPrompt = SYSTEM_PROMPTS[session.type] + (context ? `\n\n${context}` : '');

  // 构建消息列表
  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...historyMessages
  ];

  // 获取AI适配器
  let adapter: TextGenerationAdapter;
  try {
    adapter = AIAdapterFactory.getAdapterForFunction('storyboard') as TextGenerationAdapter;
  } catch {
    throw new Error('未配置文本生成AI服务，请先在设置中配置');
  }

  // 调用AI生成回复
  const prompt = buildPromptFromMessages(messages);
  const aiResponse = await adapter.generateText(prompt, {
    maxTokens: 2000,
    temperature: 0.7
  });

  // 保存AI回复
  const assistantMessage = generationMessageModel.create({
    session_id: sessionId,
    role: 'assistant',
    content: aiResponse,
    result_snapshot: aiResponse
  });

  // 更新会话的当前结果
  generationSessionModel.update(sessionId, {
    current_result: aiResponse
  });

  return {
    message: assistantMessage,
    result: aiResponse
  };
}

/**
 * 将消息列表构建为提示词
 */
function buildPromptFromMessages(messages: ChatMessage[]): string {
  let prompt = '';

  for (const msg of messages) {
    switch (msg.role) {
      case 'system':
        prompt += `系统指令：${msg.content}\n\n`;
        break;
      case 'user':
        prompt += `用户：${msg.content}\n\n`;
        break;
      case 'assistant':
        prompt += `助手：${msg.content}\n\n`;
        break;
    }
  }

  prompt += '助手：';
  return prompt;
}

/**
 * 应用修改结果到分镜
 */
export async function applyStoryboardChanges(sessionId: string): Promise<boolean> {
  const session = generationSessionModel.findById(sessionId);
  if (!session || !session.storyboard_id || !session.current_result) {
    return false;
  }

  try {
    // 尝试解析JSON结果
    const result = JSON.parse(session.current_result);

    const updateData: Record<string, unknown> = {};
    if (result.sceneDescription !== undefined) {
      updateData.scene_description = result.sceneDescription;
    }
    if (result.visualDescription !== undefined) {
      updateData.visual_description = result.visualDescription;
    }
    if (result.duration !== undefined) {
      updateData.duration = result.duration;
    }
    if (result.narration !== undefined) {
      updateData.narration = result.narration;
    }

    if (Object.keys(updateData).length > 0) {
      storyboardModel.update(session.storyboard_id, updateData);
      return true;
    }
  } catch (e) {
    console.error('Failed to parse storyboard changes:', e);
  }

  return false;
}

/**
 * 获取会话详情
 */
export function getGenerationSessionWithMessages(sessionId: string) {
  return generationSessionModel.findWithMessages(sessionId);
}

/**
 * 获取分镜的修改会话
 */
export function getStoryboardSessions(storyboardId: string, type: GenerationSessionType) {
  return generationSessionModel.findByStoryboardAndType(storyboardId, type);
}

/**
 * 获取项目的修改会话
 */
export function getProjectGenerationSessions(projectId: string, type: GenerationSessionType) {
  return generationSessionModel.findByProjectAndType(projectId, type);
}

/**
 * 更新会话
 */
export function updateGenerationSession(sessionId: string, data: Partial<GenerationSession>) {
  return generationSessionModel.update(sessionId, data);
}

/**
 * 删除会话
 */
export function deleteGenerationSession(sessionId: string): boolean {
  return generationSessionModel.delete(sessionId);
}

/**
 * 重新生成图片（基于优化后的提示词）
 */
export async function regenerateImage(
  sessionId: string,
  storyboardId: string
): Promise<{ imagePath?: string; error?: string }> {
  const session = generationSessionModel.findById(sessionId);
  if (!session || !session.current_result) {
    return { error: '会话不存在或没有优化后的提示词' };
  }

  try {
    const adapter = AIAdapterFactory.getAdapterForFunction('image') as ImageGenerationAdapter;

    // 使用优化后的提示词生成图片
    const imagePath = await adapter.generateImage(session.current_result, {
      width: 1792,
      height: 1024,
      quality: 'standard'
    });

    return { imagePath };
  } catch (e) {
    console.error('Failed to regenerate image:', e);
    return { error: e instanceof Error ? e.message : '图片生成失败' };
  }
}
