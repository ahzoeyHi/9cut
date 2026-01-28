import { projectModel } from '../../models/project';
import { storyboardModel } from '../../models/storyboard';
import { promptModel } from '../../models/prompt';
import { taskModel } from '../../models/task';
import { AIAdapterFactory } from '../ai/factory';
import type { TextGenerationAdapter, GeneratedStoryboard } from '../ai/adapter';

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

export async function generateStoryboards(
  projectId: string,
  taskId: string
): Promise<void> {
  try {
    // 更新任务状态为处理中
    taskModel.update(taskId, { status: 'processing', progress: 10 });

    // 获取项目信息
    const project = projectModel.findById(projectId);
    if (!project || !project.script) {
      throw new Error('项目不存在或文案为空');
    }

    taskModel.update(taskId, { progress: 20 });

    // 获取生效的提示词
    let promptTemplate = DEFAULT_STORYBOARD_PROMPT;
    const activePrompt = promptModel.findActiveByFunction('storyboard');
    if (activePrompt) {
      promptTemplate = activePrompt.content;
    }

    // 替换变量
    const prompt = promptTemplate.replace('{文案}', project.script);

    taskModel.update(taskId, { progress: 30 });

    // 获取AI适配器
    let adapter: TextGenerationAdapter;
    try {
      adapter = AIAdapterFactory.getAdapterForFunction('storyboard') as TextGenerationAdapter;
    } catch {
      // 如果没有配置AI服务，使用模拟数据
      console.log('No AI service configured, using mock data');
      await generateMockStoryboards(projectId, project.script, taskId);
      return;
    }

    taskModel.update(taskId, { progress: 40 });

    // 调用AI生成
    const response = await adapter.generateText(prompt);

    taskModel.update(taskId, { progress: 70 });

    // 解析响应
    let storyboards: GeneratedStoryboard[];
    try {
      // 尝试从响应中提取JSON
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('无法从响应中提取JSON');
      }
      storyboards = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('Parse error:', parseError);
      throw new Error('解析AI响应失败');
    }

    taskModel.update(taskId, { progress: 80 });

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
    storyboardModel.deleteByProjectId(projectId);

    // 创建新分镜
    storyboardModel.createBatch(storyboardData);

    taskModel.update(taskId, { progress: 90 });

    // 更新项目状态
    projectModel.update(projectId, { status: 'processing' });

    // 完成任务
    taskModel.update(taskId, {
      status: 'completed',
      progress: 100,
      result: { storyboardCount: storyboards.length }
    });

  } catch (error) {
    console.error('Error generating storyboards:', error);
    taskModel.update(taskId, {
      status: 'failed',
      error: error instanceof Error ? error.message : '生成失败'
    });
  }
}

// 生成模拟数据（用于测试）
async function generateMockStoryboards(
  projectId: string,
  script: string,
  taskId: string
): Promise<void> {
  // 简单地按句子分割文案
  const sentences = script.split(/[。！？.!?]/).filter(s => s.trim());
  const storyboards: GeneratedStoryboard[] = [];

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

  storyboardModel.deleteByProjectId(projectId);
  storyboardModel.createBatch(storyboardData);

  projectModel.update(projectId, { status: 'processing' });

  taskModel.update(taskId, {
    status: 'completed',
    progress: 100,
    result: { storyboardCount: storyboards.length, mock: true }
  });
}
