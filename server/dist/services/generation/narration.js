"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateNarration = generateNarration;
exports.splitNarration = splitNarration;
const project_1 = require("../../models/project");
const storyboard_1 = require("../../models/storyboard");
const prompt_1 = require("../../models/prompt");
const task_1 = require("../../models/task");
const factory_1 = require("../ai/factory");
// 默认的口播文案生成提示词
const DEFAULT_NARRATION_PROMPT = `请将以下文案转换为适合口播的文案。

要求：
1. 语言口语化、自然流畅
2. 适合朗读，避免书面语
3. 保持原意不变
4. 可以适当添加过渡词和语气词

原始文案：
{文案}

请直接输出口播文案内容，不需要其他解释。`;
// 默认的文案拆分提示词
const DEFAULT_SPLIT_PROMPT = `请将以下口播文案拆分为{分镜数量}个片段，每个片段对应一个分镜。

要求：
1. 每个片段语义完整
2. 片段长度与分镜时长匹配（每秒约3-4个字）
3. 以JSON数组格式返回

分镜信息：
{分镜列表}

口播文案：
{文案}

请返回JSON数组，格式如下：
[
  {"sequence": 0, "narration": "第一个片段的文案"},
  {"sequence": 1, "narration": "第二个片段的文案"}
]`;
/**
 * 生成口播文案
 */
async function generateNarration(projectId, taskId) {
    try {
        task_1.taskModel.update(taskId, { status: 'processing', progress: 10 });
        // 获取项目信息
        const project = project_1.projectModel.findById(projectId);
        if (!project || !project.script) {
            throw new Error('项目不存在或文案为空');
        }
        task_1.taskModel.update(taskId, { progress: 20 });
        // 获取生效的提示词
        let promptTemplate = DEFAULT_NARRATION_PROMPT;
        const activePrompt = prompt_1.promptModel.findActiveByFunction('narration');
        if (activePrompt) {
            promptTemplate = activePrompt.content;
        }
        // 替换变量
        const prompt = promptTemplate.replace('{文案}', project.script);
        task_1.taskModel.update(taskId, { progress: 30 });
        // 获取AI适配器
        let adapter;
        try {
            adapter = factory_1.AIAdapterFactory.getAdapterForFunction('narration');
        }
        catch {
            // 如果没有配置AI服务，使用简单处理
            console.log('No AI narration service configured, using simple conversion');
            await simpleNarrationConversion(projectId, project.script, taskId);
            return;
        }
        task_1.taskModel.update(taskId, { progress: 40 });
        // 调用AI生成
        const narration = await adapter.generateText(prompt);
        task_1.taskModel.update(taskId, { progress: 80 });
        // 更新项目（这里可以考虑存储到专门的字段或表中）
        // 暂时存储在result中
        task_1.taskModel.update(taskId, {
            status: 'completed',
            progress: 100,
            result: {
                narration: narration.trim(),
                originalScript: project.script
            }
        });
    }
    catch (error) {
        console.error('Error generating narration:', error);
        task_1.taskModel.update(taskId, {
            status: 'failed',
            error: error instanceof Error ? error.message : '口播文案生成失败'
        });
    }
}
/**
 * 简单的文案转换（不使用AI）
 */
async function simpleNarrationConversion(projectId, script, taskId) {
    // 简单处理：添加一些口语化的调整
    let narration = script
        .replace(/，/g, '，') // 保持逗号
        .replace(/。/g, '。') // 保持句号
        .replace(/！/g, '！')
        .replace(/？/g, '？');
    task_1.taskModel.update(taskId, {
        status: 'completed',
        progress: 100,
        result: {
            narration,
            originalScript: script,
            mock: true
        }
    });
}
/**
 * 拆分口播文案到分镜
 */
async function splitNarration(projectId, narration) {
    // 获取分镜列表
    const storyboards = storyboard_1.storyboardModel.findByProjectId(projectId);
    if (storyboards.length === 0) {
        throw new Error('项目没有分镜');
    }
    // 尝试使用AI拆分
    try {
        const adapter = factory_1.AIAdapterFactory.getAdapterForFunction('narration');
        // 准备分镜信息
        const storyboardInfo = storyboards.map(s => ({
            sequence: s.sequence,
            description: s.scene_description,
            duration: s.duration
        }));
        // 获取生效的提示词
        let promptTemplate = DEFAULT_SPLIT_PROMPT;
        const activePrompt = prompt_1.promptModel.findActiveByFunction('narration');
        if (activePrompt && activePrompt.content.includes('{分镜数量}')) {
            promptTemplate = activePrompt.content;
        }
        const prompt = promptTemplate
            .replace('{分镜数量}', String(storyboards.length))
            .replace('{分镜列表}', JSON.stringify(storyboardInfo, null, 2))
            .replace('{文案}', narration);
        const response = await adapter.generateText(prompt);
        // 解析响应
        const jsonMatch = response.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            const segments = JSON.parse(jsonMatch[0]);
            // 更新分镜的口播文案
            for (const segment of segments) {
                const storyboard = storyboards.find(s => s.sequence === segment.sequence);
                if (storyboard) {
                    storyboard_1.storyboardModel.update(storyboard.id, { narration: segment.narration });
                }
            }
            return segments;
        }
    }
    catch (error) {
        console.log('AI split failed, using simple split:', error);
    }
    // 简单拆分：按字数均匀分配
    return simpleSplit(projectId, narration, storyboards);
}
/**
 * 简单的文案拆分（按字数均匀分配）
 */
function simpleSplit(projectId, narration, storyboards) {
    const totalChars = narration.length;
    const totalDuration = storyboards.reduce((sum, s) => sum + s.duration, 0);
    const results = [];
    let currentIndex = 0;
    for (const storyboard of storyboards) {
        // 根据时长比例计算字数
        const ratio = storyboard.duration / totalDuration;
        const charCount = Math.floor(totalChars * ratio);
        // 找到合适的断点（句号、逗号等）
        let endIndex = currentIndex + charCount;
        if (endIndex < narration.length) {
            // 尝试在标点符号处断开
            const punctuationIndex = narration.substring(currentIndex, endIndex + 20).search(/[。！？，、]/);
            if (punctuationIndex > 0) {
                endIndex = currentIndex + punctuationIndex + 1;
            }
        }
        else {
            endIndex = narration.length;
        }
        const segment = narration.substring(currentIndex, endIndex).trim();
        results.push({
            sequence: storyboard.sequence,
            narration: segment
        });
        // 更新分镜的口播文案
        storyboard_1.storyboardModel.update(storyboard.id, { narration: segment });
        currentIndex = endIndex;
    }
    return results;
}
//# sourceMappingURL=narration.js.map