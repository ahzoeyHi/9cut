"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateImage = generateImage;
const storyboard_1 = require("../../models/storyboard");
const resource_1 = require("../../models/resource");
const prompt_1 = require("../../models/prompt");
const task_1 = require("../../models/task");
const factory_1 = require("../ai/factory");
// 默认的图片生成提示词
const DEFAULT_IMAGE_PROMPT = `根据以下分镜描述生成一张高质量的图片：

场景描述：{场景描述}
画面说明：{画面说明}

要求：
1. 风格：现代、专业的商业视频画面
2. 色彩：明亮、对比度适中
3. 构图：适合16:9视频画面
4. 质量：高清、细节丰富`;
async function generateImage(storyboardId, taskId) {
    try {
        // 更新任务状态为处理中
        task_1.taskModel.update(taskId, { status: 'processing', progress: 10 });
        // 获取分镜信息
        const storyboard = storyboard_1.storyboardModel.findById(storyboardId);
        if (!storyboard) {
            throw new Error('分镜不存在');
        }
        task_1.taskModel.update(taskId, { progress: 20 });
        // 获取生效的提示词
        let promptTemplate = DEFAULT_IMAGE_PROMPT;
        const activePrompt = prompt_1.promptModel.findActiveByFunction('image');
        if (activePrompt) {
            promptTemplate = activePrompt.content;
        }
        // 替换变量
        const prompt = promptTemplate
            .replace('{场景描述}', storyboard.scene_description || '')
            .replace('{画面说明}', storyboard.visual_description || '');
        task_1.taskModel.update(taskId, { progress: 30 });
        // 获取AI适配器
        let adapter;
        try {
            adapter = factory_1.AIAdapterFactory.getAdapterForFunction('image');
        }
        catch {
            // 如果没有配置AI服务，使用模拟数据
            console.log('No AI image service configured, using mock data');
            await generateMockImage(storyboardId, taskId);
            return;
        }
        task_1.taskModel.update(taskId, { progress: 40 });
        // 更新分镜状态为生成中
        storyboard_1.storyboardModel.update(storyboardId, { status: 'generating' });
        // 调用AI生成图片
        const imagePath = await adapter.generateImage(prompt, {
            width: 1792,
            height: 1024,
            quality: 'standard'
        });
        task_1.taskModel.update(taskId, { progress: 80 });
        // 获取项目ID
        const projectId = storyboard.project_id;
        // 创建资源记录
        const resource = resource_1.resourceModel.create({
            type: 'image',
            subtype: 'last_frame',
            file_path: imagePath,
            storyboard_id: storyboardId,
            project_id: projectId,
            metadata: {
                prompt,
                generatedAt: new Date().toISOString()
            }
        });
        // 关联资源到分镜（作为尾帧）
        resource_1.resourceModel.linkToStoryboard(storyboardId, resource.id, 'last_frame');
        // 处理首帧逻辑：如果这个分镜不是第一个，则将上一个分镜的尾帧设置为当前分镜的首帧
        if (storyboard.sequence > 0) {
            // 获取上一个分镜
            const storyboards = storyboard_1.storyboardModel.findByProjectId(projectId);
            const prevStoryboard = storyboards.find(s => s.sequence === storyboard.sequence - 1);
            if (prevStoryboard && prevStoryboard.last_frame_url) {
                // 获取上一个分镜的尾帧资源
                const prevResources = resource_1.resourceModel.findAll({ storyboardId: prevStoryboard.id });
                const prevLastFrame = prevResources.find(r => r.subtype === 'last_frame');
                if (prevLastFrame) {
                    // 将上一个分镜的尾帧作为当前分镜的首帧
                    resource_1.resourceModel.linkToStoryboard(storyboardId, prevLastFrame.id, 'first_frame');
                }
            }
        }
        else {
            // 第一个分镜，尾帧也作为首帧
            resource_1.resourceModel.linkToStoryboard(storyboardId, resource.id, 'first_frame');
        }
        task_1.taskModel.update(taskId, { progress: 90 });
        // 更新下一个分镜的首帧（如果存在）
        const storyboards = storyboard_1.storyboardModel.findByProjectId(projectId);
        const nextStoryboard = storyboards.find(s => s.sequence === storyboard.sequence + 1);
        if (nextStoryboard) {
            // 将当前分镜的尾帧设置为下一个分镜的首帧
            resource_1.resourceModel.linkToStoryboard(nextStoryboard.id, resource.id, 'first_frame');
        }
        // 更新分镜状态为完成
        storyboard_1.storyboardModel.update(storyboardId, { status: 'completed' });
        // 完成任务
        task_1.taskModel.update(taskId, {
            status: 'completed',
            progress: 100,
            result: {
                resourceId: resource.id,
                imagePath
            }
        });
    }
    catch (error) {
        console.error('Error generating image:', error);
        // 更新分镜状态为错误
        storyboard_1.storyboardModel.update(storyboardId, { status: 'error' });
        task_1.taskModel.update(taskId, {
            status: 'failed',
            error: error instanceof Error ? error.message : '图片生成失败'
        });
    }
}
// 生成模拟图片（用于测试）
async function generateMockImage(storyboardId, taskId) {
    const storyboard = storyboard_1.storyboardModel.findById(storyboardId);
    if (!storyboard) {
        throw new Error('分镜不存在');
    }
    // 模拟延迟
    await new Promise(resolve => setTimeout(resolve, 1000));
    // 创建模拟资源记录（使用占位图路径）
    const mockPath = 'images/placeholder.png';
    const resource = resource_1.resourceModel.create({
        type: 'image',
        subtype: 'last_frame',
        file_path: mockPath,
        storyboard_id: storyboardId,
        project_id: storyboard.project_id,
        metadata: {
            mock: true,
            generatedAt: new Date().toISOString()
        }
    });
    // 关联资源
    resource_1.resourceModel.linkToStoryboard(storyboardId, resource.id, 'last_frame');
    // 第一个分镜也关联为首帧
    if (storyboard.sequence === 0) {
        resource_1.resourceModel.linkToStoryboard(storyboardId, resource.id, 'first_frame');
    }
    // 更新分镜状态
    storyboard_1.storyboardModel.update(storyboardId, { status: 'completed' });
    task_1.taskModel.update(taskId, {
        status: 'completed',
        progress: 100,
        result: {
            resourceId: resource.id,
            imagePath: mockPath,
            mock: true
        }
    });
}
//# sourceMappingURL=image.js.map