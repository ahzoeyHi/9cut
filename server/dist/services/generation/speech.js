"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSpeech = generateSpeech;
const storyboard_1 = require("../../models/storyboard");
const resource_1 = require("../../models/resource");
const task_1 = require("../../models/task");
const factory_1 = require("../ai/factory");
const config_1 = require("../../config");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const uuid_1 = require("uuid");
/**
 * 生成语音
 */
async function generateSpeech(storyboardId, taskId, options) {
    try {
        task_1.taskModel.update(taskId, { status: 'processing', progress: 10 });
        // 获取分镜信息
        const storyboard = storyboard_1.storyboardModel.findById(storyboardId);
        if (!storyboard) {
            throw new Error('分镜不存在');
        }
        // 检查口播文案
        if (!storyboard.narration) {
            throw new Error('分镜没有口播文案，请先生成或输入口播文案');
        }
        task_1.taskModel.update(taskId, { progress: 20 });
        // 更新分镜状态
        storyboard_1.storyboardModel.update(storyboardId, { status: 'generating' });
        // 获取AI适配器
        let adapter;
        try {
            adapter = factory_1.AIAdapterFactory.getAdapterForFunction('speech');
        }
        catch {
            // 如果没有配置TTS服务，使用模拟数据
            console.log('No TTS service configured, using mock data');
            await generateMockSpeech(storyboardId, taskId);
            return;
        }
        task_1.taskModel.update(taskId, { progress: 40 });
        // 调用TTS服务
        const audioBuffer = await adapter.synthesizeSpeech(storyboard.narration, {
            voiceId: options?.voiceId,
            speed: options?.speed || 1.0,
            format: 'mp3'
        });
        task_1.taskModel.update(taskId, { progress: 70 });
        // 保存音频文件
        const generatedDir = config_1.config.getAbsolutePath(config_1.config.storage.generatedDir);
        const audioDir = path_1.default.join(generatedDir, 'audio');
        if (!fs_1.default.existsSync(audioDir)) {
            fs_1.default.mkdirSync(audioDir, { recursive: true });
        }
        const filename = `${(0, uuid_1.v4)()}.mp3`;
        const filePath = path_1.default.join(audioDir, filename);
        fs_1.default.writeFileSync(filePath, audioBuffer);
        task_1.taskModel.update(taskId, { progress: 80 });
        // 创建资源记录
        const stats = fs_1.default.statSync(filePath);
        const resource = resource_1.resourceModel.create({
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
        resource_1.resourceModel.linkToStoryboard(storyboardId, resource.id, 'speech');
        task_1.taskModel.update(taskId, { progress: 90 });
        // 更新分镜状态
        storyboard_1.storyboardModel.update(storyboardId, { status: 'completed' });
        // 完成任务
        task_1.taskModel.update(taskId, {
            status: 'completed',
            progress: 100,
            result: {
                resourceId: resource.id,
                audioPath: `audio/${filename}`
            }
        });
    }
    catch (error) {
        console.error('Error generating speech:', error);
        storyboard_1.storyboardModel.update(storyboardId, { status: 'error' });
        task_1.taskModel.update(taskId, {
            status: 'failed',
            error: error instanceof Error ? error.message : '语音生成失败'
        });
    }
}
/**
 * 生成模拟语音（用于测试）
 */
async function generateMockSpeech(storyboardId, taskId) {
    const storyboard = storyboard_1.storyboardModel.findById(storyboardId);
    if (!storyboard) {
        throw new Error('分镜不存在');
    }
    // 模拟延迟
    await new Promise(resolve => setTimeout(resolve, 500));
    // 创建模拟资源记录
    const mockPath = 'audio/placeholder.mp3';
    const resource = resource_1.resourceModel.create({
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
    resource_1.resourceModel.linkToStoryboard(storyboardId, resource.id, 'speech');
    // 更新分镜状态
    storyboard_1.storyboardModel.update(storyboardId, { status: 'completed' });
    task_1.taskModel.update(taskId, {
        status: 'completed',
        progress: 100,
        result: {
            resourceId: resource.id,
            audioPath: mockPath,
            mock: true
        }
    });
}
//# sourceMappingURL=speech.js.map