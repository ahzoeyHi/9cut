import type { ScriptSession, ScriptMessage } from '../../models/scriptSession';
export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}
/**
 * 创建新的口播稿会话
 */
export declare function createScriptSession(projectId: string, title?: string): ScriptSession;
/**
 * 发送消息并获取AI回复
 */
export declare function sendMessage(sessionId: string, userMessage: string): Promise<{
    message: ScriptMessage;
    script?: string;
}>;
/**
 * 获取会话详情（包含消息历史）
 */
export declare function getSessionWithMessages(sessionId: string): import("../../models/scriptSession").ScriptSessionWithMessages | null;
/**
 * 获取项目的所有会话
 */
export declare function getProjectSessions(projectId: string): ScriptSession[];
/**
 * 更新会话信息
 */
export declare function updateSession(sessionId: string, data: Partial<ScriptSession>): ScriptSession | null;
/**
 * 删除会话
 */
export declare function deleteSession(sessionId: string): boolean;
/**
 * 应用口播稿到项目
 */
export declare function applyScriptToProject(sessionId: string): {
    session: ScriptSession;
    project: any;
} | null;
//# sourceMappingURL=script.d.ts.map