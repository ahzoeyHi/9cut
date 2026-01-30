import { scriptSessionModel, scriptMessageModel } from '../../models/scriptSession';
import type { ScriptSession, ScriptMessage } from '../../models/scriptSession';
import { projectModel } from '../../models/project';
import { AIAdapterFactory } from '../ai/factory';
import type { TextGenerationAdapter } from '../ai/adapter';

// 默认的口播稿生成系统提示词
const DEFAULT_SYSTEM_PROMPT = `你是一个专业的口播稿撰写助手。你的任务是根据用户的需求生成或修改口播稿。

要求：
1. 语言口语化、自然流畅，适合朗读
2. 结构清晰，有引入、主体、结尾
3. 内容有吸引力，能抓住观众注意力
4. 根据用户反馈进行精准修改

请直接输出口播稿内容，不需要额外的解释说明。`;

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/**
 * 创建新的口播稿会话
 */
export function createScriptSession(projectId: string, title?: string): ScriptSession {
  return scriptSessionModel.create({
    project_id: projectId,
    title: title || '新口播稿'
  });
}

/**
 * 获取会话历史消息并转换为聊天格式
 */
function getSessionMessages(sessionId: string): ChatMessage[] {
  const messages = scriptMessageModel.findBySessionId(sessionId);
  return messages.map(msg => ({
    role: msg.role,
    content: msg.content
  }));
}

/**
 * 发送消息并获取AI回复
 */
export async function sendMessage(
  sessionId: string,
  userMessage: string
): Promise<{ message: ScriptMessage; script?: string }> {
  // 获取会话
  const session = scriptSessionModel.findById(sessionId);
  if (!session) {
    throw new Error('会话不存在');
  }

  // 保存用户消息
  scriptMessageModel.create({
    session_id: sessionId,
    role: 'user',
    content: userMessage
  });

  // 获取历史消息
  const historyMessages = getSessionMessages(sessionId);

  // 构建消息列表，添加系统提示
  const messages: ChatMessage[] = [
    { role: 'system', content: DEFAULT_SYSTEM_PROMPT },
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
  const assistantMessage = scriptMessageModel.create({
    session_id: sessionId,
    role: 'assistant',
    content: aiResponse,
    script_version: aiResponse
  });

  // 更新会话的当前口播稿
  scriptSessionModel.update(sessionId, {
    current_script: aiResponse
  });

  return {
    message: assistantMessage,
    script: aiResponse
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
 * 获取会话详情（包含消息历史）
 */
export function getSessionWithMessages(sessionId: string) {
  return scriptSessionModel.findWithMessages(sessionId);
}

/**
 * 获取项目的所有会话
 */
export function getProjectSessions(projectId: string): ScriptSession[] {
  return scriptSessionModel.findByProjectId(projectId);
}

/**
 * 更新会话信息
 */
export function updateSession(sessionId: string, data: Partial<ScriptSession>) {
  return scriptSessionModel.update(sessionId, data);
}

/**
 * 删除会话
 */
export function deleteSession(sessionId: string): boolean {
  return scriptSessionModel.delete(sessionId);
}

/**
 * 应用口播稿到项目
 */
export function applyScriptToProject(sessionId: string): { session: ScriptSession; project: any } | null {
  const session = scriptSessionModel.findById(sessionId);
  if (!session || !session.current_script) {
    return null;
  }

  // 将口播稿保存到项目的 script 字段
  const project = projectModel.update(session.project_id, {
    script: session.current_script
  });

  if (!project) {
    return null;
  }

  return { session, project };
}
