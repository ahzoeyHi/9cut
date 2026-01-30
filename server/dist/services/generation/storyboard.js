"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateStoryboards = generateStoryboards;
exports.regenerateSingleStoryboard = regenerateSingleStoryboard;
const project_1 = require("../../models/project");
const storyboard_1 = require("../../models/storyboard");
const prompt_1 = require("../../models/prompt");
const task_1 = require("../../models/task");
const factory_1 = require("../ai/factory");
// 默认的分镜生成提示词
const DEFAULT_STORYBOARD_PROMPT = `你是一个专业的分镜脚本编写专家。请根据以下口播文案，生成分镜脚本。

要求：
1. 每个分镜包含：场景描述、画面说明、预计时长（毫秒）
2. 分镜数量尽量是9的倍数，以便组成9宫格
3. 每个分镜时长建议3-5秒
4. 画面说明要具体、可视化、易于生成图片

请以JSON数组格式返回，格式如下：
[
  {
    "sceneDescription": "场景描述",
    "visualDescription": "具体的画面说明",
    "duration": 3000
  }
]

文案内容：
{文案}`;
async function generateStoryboards(projectId, taskId) {
    try {
        // 更新任务状态为处理中
        task_1.taskModel.update(taskId, { status: 'processing', progress: 10 });
        // 获取项目信息
        const project = project_1.projectModel.findById(projectId);
        if (!project || !project.script) {
            throw new Error('项目不存在或文案为空');
        }
        task_1.taskModel.update(taskId, { progress: 20 });
        // 获取生效的提示词
        let promptTemplate = DEFAULT_STORYBOARD_PROMPT;
        const activePrompt = prompt_1.promptModel.findActiveByFunction('storyboard');
        if (activePrompt) {
            promptTemplate = activePrompt.content;
        }
        // 替换变量
        const prompt = promptTemplate.replace('{文案}', project.script);
        task_1.taskModel.update(taskId, { progress: 30 });
        // 获取AI适配器
        let adapter;
        try {
            adapter = factory_1.AIAdapterFactory.getAdapterForFunction('storyboard');
        }
        catch {
            // 如果没有配置AI服务，使用模拟数据
            console.log('No AI service configured, using mock data');
            await generateMockStoryboards(projectId, project.script, taskId);
            return;
        }
        task_1.taskModel.update(taskId, { progress: 40 });
        // 调用AI生成
        const response = await adapter.generateText(prompt);
        task_1.taskModel.update(taskId, { progress: 70 });
        // 解析响应
        let storyboards;
        try {
            // 尝试从响应中提取JSON
            const jsonMatch = response.match(/\[[\s\S]*\]/);
            if (!jsonMatch) {
                throw new Error('无法从响应中提取JSON');
            }
            storyboards = JSON.parse(jsonMatch[0]);
        }
        catch (parseError) {
            console.error('Parse error:', parseError);
            throw new Error('解析AI响应失败');
        }
        task_1.taskModel.update(taskId, { progress: 80 });
        // 补齐到9的倍数
        const remainder = storyboards.length % 9;
        if (remainder > 0) {
            const padding = 9 - remainder;
            for (let i = 0; i < padding; i++) {
                storyboards.push({
                    sequence: storyboards.length,
                    sceneDescription: '过渡场景',
                    visualDescription: '简洁的过渡画面',
                    duration: 2000
                });
            }
        }
        // 保存分镜
        const storyboardData = storyboards.map((s, index) => ({
            project_id: projectId,
            sequence: index,
            scene_description: s.sceneDescription,
            visual_description: s.visualDescription,
            duration: s.duration || 3000,
            narration: s.narration
        }));
        // 先删除旧分镜
        storyboard_1.storyboardModel.deleteByProjectId(projectId);
        // 创建新分镜
        storyboard_1.storyboardModel.createBatch(storyboardData);
        task_1.taskModel.update(taskId, { progress: 90 });
        // 更新项目状态
        project_1.projectModel.update(projectId, { status: 'processing' });
        // 完成任务
        task_1.taskModel.update(taskId, {
            status: 'completed',
            progress: 100,
            result: { storyboardCount: storyboards.length }
        });
    }
    catch (error) {
        console.error('Error generating storyboards:', error);
        task_1.taskModel.update(taskId, {
            status: 'failed',
            error: error instanceof Error ? error.message : '生成失败'
        });
    }
}
// 重新生成单个分镜的提示词模板
const REGENERATE_SINGLE_STORYBOARD_PROMPT = `你是一个专业的分镜脚本编写专家。请根据用户的修改指令，重新生成这个分镜。

当前分镜信息：
- 场景描述: {sceneDescription}
- 画面说明: {visualDescription}
- 时长: {duration}毫秒

用户修改指令: {instruction}

请根据用户指令修改分镜内容，以JSON格式返回：
{
  "sceneDescription": "新的场景描述",
  "visualDescription": "新的具体画面说明",
  "duration": 时长毫秒数
}

注意：
1. 画面说明要具体、可视化、易于生成图片
2. 如果用户没有特别指定，保持原有时长
3. 只返回JSON，不要其他内容`;
/**
 * 重新生成单个分镜
 */
async function regenerateSingleStoryboard(storyboardId, instruction) {
    try {
        // 获取现有分镜
        const storyboard = storyboard_1.storyboardModel.findById(storyboardId);
        if (!storyboard) {
            return { success: false, error: '分镜不存在' };
        }
        // 获取AI适配器
        let adapter;
        try {
            adapter = factory_1.AIAdapterFactory.getAdapterForFunction('storyboard');
        }
        catch {
            return { success: false, error: '未配置AI服务，请先在设置中配置' };
        }
        // 构建提示词
        const prompt = REGENERATE_SINGLE_STORYBOARD_PROMPT
            .replace('{sceneDescription}', storyboard.scene_description || '未设置')
            .replace('{visualDescription}', storyboard.visual_description || '未设置')
            .replace('{duration}', String(storyboard.duration || 3000))
            .replace('{instruction}', instruction);
        // 调用AI生成
        const response = await adapter.generateText(prompt, {
            maxTokens: 1000,
            temperature: 0.7
        });
        // 解析响应
        let result;
        try {
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('无法从响应中提取JSON');
            }
            result = JSON.parse(jsonMatch[0]);
        }
        catch (parseError) {
            console.error('Parse error:', parseError);
            return { success: false, error: '解析AI响应失败' };
        }
        // 更新分镜
        const updated = storyboard_1.storyboardModel.update(storyboardId, {
            scene_description: result.sceneDescription,
            visual_description: result.visualDescription,
            duration: result.duration || storyboard.duration
        });
        if (!updated) {
            return { success: false, error: '更新分镜失败' };
        }
        return {
            success: true,
            storyboard: {
                id: updated.id,
                projectId: updated.project_id,
                sequence: updated.sequence,
                sceneDescription: updated.scene_description,
                visualDescription: updated.visual_description,
                duration: updated.duration,
                status: updated.status
            }
        };
    }
    catch (error) {
        console.error('Error regenerating storyboard:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : '重新生成失败'
        };
    }
}
// 生成模拟数据（用于测试）
async function generateMockStoryboards(projectId, script, taskId) {
    // 简单地按句子分割文案
    const sentences = script.split(/[。！？.!?]/).filter(s => s.trim());
    const storyboards = [];
    for (let i = 0; i < sentences.length; i++) {
        storyboards.push({
            sequence: i,
            sceneDescription: `场景 ${i + 1}`,
            visualDescription: sentences[i].trim().slice(0, 50) + '...',
            duration: 3000
        });
    }
    // 补齐到9的倍数
    const remainder = storyboards.length % 9;
    if (remainder > 0) {
        const padding = 9 - remainder;
        for (let i = 0; i < padding; i++) {
            storyboards.push({
                sequence: storyboards.length,
                sceneDescription: '过渡场景',
                visualDescription: '简洁的过渡画面',
                duration: 2000
            });
        }
    }
    // 保存分镜
    const storyboardData = storyboards.map((s, index) => ({
        project_id: projectId,
        sequence: index,
        scene_description: s.sceneDescription,
        visual_description: s.visualDescription,
        duration: s.duration
    }));
    storyboard_1.storyboardModel.deleteByProjectId(projectId);
    storyboard_1.storyboardModel.createBatch(storyboardData);
    project_1.projectModel.update(projectId, { status: 'processing' });
    task_1.taskModel.update(taskId, {
        status: 'completed',
        progress: 100,
        result: { storyboardCount: storyboards.length, mock: true }
    });
}
//# sourceMappingURL=storyboard.js.map