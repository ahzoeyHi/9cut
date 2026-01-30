"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createScriptSession = createScriptSession;
exports.sendMessage = sendMessage;
exports.getSessionWithMessages = getSessionWithMessages;
exports.getProjectSessions = getProjectSessions;
exports.updateSession = updateSession;
exports.deleteSession = deleteSession;
exports.applyScriptToProject = applyScriptToProject;
const scriptSession_1 = require("../../models/scriptSession");
const project_1 = require("../../models/project");
const factory_1 = require("../ai/factory");
// 默认的口播稿生成系统提示词
const DEFAULT_SYSTEM_PROMPT = `你是一个专业的口播稿撰写助手。你的任务是根据用户的需求生成或修改口播稿。

要求：
1. 语言口语化、自然流畅，适合朗读
2. 结构清晰，有引入、主体、结尾
3. 内容有吸引力，能抓住观众注意力
4. 根据用户反馈进行精准修改

请直接输出口播稿内容，不需要额外的解释说明。`;
/**
 * 创建新的口播稿会话
 */
function createScriptSession(projectId, title) {
    return scriptSession_1.scriptSessionModel.create({
        project_id: projectId,
        title: title || '新口播稿'
    });
}
/**
 * 获取会话历史消息并转换为聊天格式
 */
function getSessionMessages(sessionId) {
    const messages = scriptSession_1.scriptMessageModel.findBySessionId(sessionId);
    return messages.map(msg => ({
        role: msg.role,
        content: msg.content
    }));
}
/**
 * 发送消息并获取AI回复
 */
async function sendMessage(sessionId, userMessage) {
    // 获取会话
    const session = scriptSession_1.scriptSessionModel.findById(sessionId);
    if (!session) {
        throw new Error('会话不存在');
    }
    // 保存用户消息
    scriptSession_1.scriptMessageModel.create({
        session_id: sessionId,
        role: 'user',
        content: userMessage
    });
    // 获取历史消息
    const historyMessages = getSessionMessages(sessionId);
    // 构建消息列表，添加系统提示
    const messages = [
        { role: 'system', content: DEFAULT_SYSTEM_PROMPT },
        ...historyMessages
    ];
    // 获取AI适配器
    let adapter;
    try {
        adapter = factory_1.AIAdapterFactory.getAdapterForFunction('storyboard');
    }
    catch {
        throw new Error('未配置文本生成AI服务，请先在设置中配置');
    }
    // 调用AI生成回复
    const prompt = buildPromptFromMessages(messages);
    const aiResponse = await adapter.generateText(prompt, {
        maxTokens: 2000,
        temperature: 0.7
    });
    // 保存AI回复
    const assistantMessage = scriptSession_1.scriptMessageModel.create({
        session_id: sessionId,
        role: 'assistant',
        content: aiResponse,
        script_version: aiResponse
    });
    // 更新会话的当前口播稿
    scriptSession_1.scriptSessionModel.update(sessionId, {
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
function buildPromptFromMessages(messages) {
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
function getSessionWithMessages(sessionId) {
    return scriptSession_1.scriptSessionModel.findWithMessages(sessionId);
}
/**
 * 获取项目的所有会话
 */
function getProjectSessions(projectId) {
    return scriptSession_1.scriptSessionModel.findByProjectId(projectId);
}
/**
 * 更新会话信息
 */
function updateSession(sessionId, data) {
    return scriptSession_1.scriptSessionModel.update(sessionId, data);
}
/**
 * 删除会话
 */
function deleteSession(sessionId) {
    return scriptSession_1.scriptSessionModel.delete(sessionId);
}
/**
 * 应用口播稿到项目
 */
function applyScriptToProject(sessionId) {
    const session = scriptSession_1.scriptSessionModel.findById(sessionId);
    if (!session || !session.current_script) {
        return null;
    }
    // 将口播稿保存到项目的 script 字段
    const project = project_1.projectModel.update(session.project_id, {
        script: session.current_script
    });
    if (!project) {
        return null;
    }
    return { session, project };
}
//# sourceMappingURL=script.js.map