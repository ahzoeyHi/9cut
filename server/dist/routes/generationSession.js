"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const session_1 = require("../services/generation/session");
const router = (0, express_1.Router)();
// 转换会话数据格式
function formatSession(session) {
    return {
        id: session.id,
        type: session.type,
        projectId: session.project_id,
        storyboardId: session.storyboard_id,
        title: session.title,
        currentResult: session.current_result,
        status: session.status,
        createdAt: session.created_at,
        updatedAt: session.updated_at
    };
}
// 转换消息数据格式
function formatMessage(message) {
    return {
        id: message.id,
        sessionId: message.session_id,
        role: message.role,
        content: message.content,
        resultSnapshot: message.result_snapshot,
        createdAt: message.created_at
    };
}
// 获取分镜的修改会话列表
router.get('/storyboards/:storyboardId/generation-sessions', (req, res) => {
    try {
        const { type } = req.query;
        if (!type || !['storyboard', 'image', 'video', 'speech'].includes(type)) {
            return res.status(400).json({ message: 'type参数必须是storyboard、image、video或speech' });
        }
        const sessions = (0, session_1.getStoryboardSessions)(req.params.storyboardId, type);
        res.json({
            sessions: sessions.map(formatSession)
        });
    }
    catch (error) {
        console.error('Error fetching generation sessions:', error);
        res.status(500).json({ message: '获取修改会话列表失败' });
    }
});
// 获取项目的修改会话列表
router.get('/projects/:projectId/generation-sessions', (req, res) => {
    try {
        const { type } = req.query;
        if (!type || !['storyboard', 'image', 'video', 'speech'].includes(type)) {
            return res.status(400).json({ message: 'type参数必须是storyboard、image、video或speech' });
        }
        const sessions = (0, session_1.getProjectGenerationSessions)(req.params.projectId, type);
        res.json({
            sessions: sessions.map(formatSession)
        });
    }
    catch (error) {
        console.error('Error fetching generation sessions:', error);
        res.status(500).json({ message: '获取修改会话列表失败' });
    }
});
// 创建新的修改会话
router.post('/generation-sessions', (req, res) => {
    try {
        const { type, projectId, storyboardId, title } = req.body;
        if (!type || !['storyboard', 'image', 'video', 'speech'].includes(type)) {
            return res.status(400).json({ message: 'type参数必须是storyboard、image、video或speech' });
        }
        if (!projectId) {
            return res.status(400).json({ message: 'projectId不能为空' });
        }
        const session = (0, session_1.createGenerationSession)(type, projectId, storyboardId, title);
        res.status(201).json({
            session: formatSession(session)
        });
    }
    catch (error) {
        console.error('Error creating generation session:', error);
        res.status(500).json({ message: '创建修改会话失败' });
    }
});
// 获取会话详情（包含消息历史）
router.get('/generation-sessions/:id', (req, res) => {
    try {
        const session = (0, session_1.getGenerationSessionWithMessages)(req.params.id);
        if (!session) {
            return res.status(404).json({ message: '会话不存在' });
        }
        res.json({
            session: {
                ...formatSession(session),
                messages: session.messages.map(formatMessage)
            }
        });
    }
    catch (error) {
        console.error('Error fetching generation session:', error);
        res.status(500).json({ message: '获取修改会话详情失败' });
    }
});
// 更新会话信息
router.put('/generation-sessions/:id', (req, res) => {
    try {
        const { title, status } = req.body;
        const session = (0, session_1.updateGenerationSession)(req.params.id, { title, status });
        if (!session) {
            return res.status(404).json({ message: '会话不存在' });
        }
        res.json({
            session: formatSession(session)
        });
    }
    catch (error) {
        console.error('Error updating generation session:', error);
        res.status(500).json({ message: '更新修改会话失败' });
    }
});
// 删除会话
router.delete('/generation-sessions/:id', (req, res) => {
    try {
        const success = (0, session_1.deleteGenerationSession)(req.params.id);
        if (!success) {
            return res.status(404).json({ message: '会话不存在' });
        }
        res.json({ success: true });
    }
    catch (error) {
        console.error('Error deleting generation session:', error);
        res.status(500).json({ message: '删除修改会话失败' });
    }
});
// 发送消息并获取AI回复
router.post('/generation-sessions/:id/messages', async (req, res) => {
    try {
        const { content } = req.body;
        if (!content || !content.trim()) {
            return res.status(400).json({ message: '消息内容不能为空' });
        }
        const result = await (0, session_1.sendGenerationMessage)(req.params.id, content.trim());
        res.json({
            message: formatMessage(result.message),
            result: result.result
        });
    }
    catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({
            message: error instanceof Error ? error.message : '发送消息失败'
        });
    }
});
// 应用分镜修改
router.post('/generation-sessions/:id/apply-storyboard', async (req, res) => {
    try {
        const success = await (0, session_1.applyStoryboardChanges)(req.params.id);
        if (!success) {
            return res.status(400).json({ message: '应用修改失败，请检查会话状态和结果格式' });
        }
        res.json({ success: true });
    }
    catch (error) {
        console.error('Error applying storyboard changes:', error);
        res.status(500).json({ message: '应用分镜修改失败' });
    }
});
// 应用图片提示词修改
router.post('/generation-sessions/:id/apply-image', async (req, res) => {
    try {
        const success = await (0, session_1.applyImageChanges)(req.params.id);
        if (!success) {
            return res.status(400).json({ message: '应用修改失败，请检查会话状态' });
        }
        res.json({ success: true });
    }
    catch (error) {
        console.error('Error applying image changes:', error);
        res.status(500).json({ message: '应用图片修改失败' });
    }
});
// 应用视频参数修改
router.post('/generation-sessions/:id/apply-video', async (req, res) => {
    try {
        const success = await (0, session_1.applyVideoChanges)(req.params.id);
        if (!success) {
            return res.status(400).json({ message: '应用修改失败，请检查会话状态和结果格式' });
        }
        res.json({ success: true });
    }
    catch (error) {
        console.error('Error applying video changes:', error);
        res.status(500).json({ message: '应用视频修改失败' });
    }
});
// 应用语音参数修改
router.post('/generation-sessions/:id/apply-speech', async (req, res) => {
    try {
        const success = await (0, session_1.applySpeechChanges)(req.params.id);
        if (!success) {
            return res.status(400).json({ message: '应用修改失败，请检查会话状态和结果格式' });
        }
        res.json({ success: true });
    }
    catch (error) {
        console.error('Error applying speech changes:', error);
        res.status(500).json({ message: '应用语音修改失败' });
    }
});
// 重新生成图片
router.post('/generation-sessions/:id/regenerate-image', async (req, res) => {
    try {
        const { storyboardId } = req.body;
        if (!storyboardId) {
            return res.status(400).json({ message: 'storyboardId不能为空' });
        }
        const result = await (0, session_1.regenerateImage)(req.params.id, storyboardId);
        if (result.error) {
            return res.status(400).json({ message: result.error });
        }
        res.json({
            imagePath: result.imagePath
        });
    }
    catch (error) {
        console.error('Error regenerating image:', error);
        res.status(500).json({ message: '重新生成图片失败' });
    }
});
exports.default = router;
//# sourceMappingURL=generationSession.js.map