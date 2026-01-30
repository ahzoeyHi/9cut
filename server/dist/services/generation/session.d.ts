import { type GenerationSession, type GenerationMessage, type GenerationSessionType } from '../../models/generationSession';
/**
 * 创建新的生成会话
 */
export declare function createGenerationSession(type: GenerationSessionType, projectId: string, storyboardId?: string, title?: string): GenerationSession;
/**
 * 发送消息并获取AI回复
 */
export declare function sendGenerationMessage(sessionId: string, userMessage: string): Promise<{
    message: GenerationMessage;
    result?: string;
}>;
/**
 * 应用修改结果到分镜
 */
export declare function applyStoryboardChanges(sessionId: string): Promise<boolean>;
/**
 * 获取会话详情
 */
export declare function getGenerationSessionWithMessages(sessionId: string): import("../../models/generationSession").GenerationSessionWithMessages | null;
/**
 * 获取分镜的修改会话
 */
export declare function getStoryboardSessions(storyboardId: string, type: GenerationSessionType): GenerationSession[];
/**
 * 获取项目的修改会话
 */
export declare function getProjectGenerationSessions(projectId: string, type: GenerationSessionType): GenerationSession[];
/**
 * 更新会话
 */
export declare function updateGenerationSession(sessionId: string, data: Partial<GenerationSession>): GenerationSession | null;
/**
 * 删除会话
 */
export declare function deleteGenerationSession(sessionId: string): boolean;
/**
 * 应用视频参数修改
 */
export declare function applyVideoChanges(sessionId: string): Promise<boolean>;
/**
 * 应用语音参数修改
 */
export declare function applySpeechChanges(sessionId: string): Promise<boolean>;
/**
 * 应用图片提示词修改（保存到分镜的画面说明）
 */
export declare function applyImageChanges(sessionId: string): Promise<boolean>;
/**
 * 重新生成图片（基于优化后的提示词）
 */
export declare function regenerateImage(sessionId: string, storyboardId: string): Promise<{
    imagePath?: string;
    error?: string;
}>;
//# sourceMappingURL=session.d.ts.map