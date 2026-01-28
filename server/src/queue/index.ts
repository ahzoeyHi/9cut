import { taskModel } from '../models/task';
import type { Task } from '../types';
import { generateStoryboards } from '../services/generation/storyboard';

// 简单的任务处理器
class TaskProcessor {
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;

  start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.intervalId = setInterval(() => this.processNextTask(), 2000);
    console.log('Task processor started');
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('Task processor stopped');
  }

  private async processNextTask(): Promise<void> {
    // 检查是否有正在处理的任务
    const processingTasks = taskModel.findProcessing();
    if (processingTasks.length > 0) {
      return; // 等待当前任务完成
    }

    // 获取下一个待处理的任务
    const pendingTasks = taskModel.findPending();
    if (pendingTasks.length === 0) {
      return;
    }

    const task = pendingTasks[0];
    await this.processTask(task);
  }

  private async processTask(task: Task): Promise<void> {
    console.log(`Processing task: ${task.id} (${task.type})`);

    try {
      switch (task.type) {
        case 'storyboard':
          if (task.project_id) {
            await generateStoryboards(task.project_id, task.id);
          }
          break;

        case 'image':
          // TODO: 实现图片生成
          taskModel.update(task.id, {
            status: 'completed',
            progress: 100,
            result: { message: 'Image generation not implemented yet' }
          });
          break;

        case 'video':
          // TODO: 实现视频生成
          taskModel.update(task.id, {
            status: 'completed',
            progress: 100,
            result: { message: 'Video generation not implemented yet' }
          });
          break;

        case 'narration':
          // TODO: 实现口播文案生成
          taskModel.update(task.id, {
            status: 'completed',
            progress: 100,
            result: { message: 'Narration generation not implemented yet' }
          });
          break;

        case 'speech':
          // TODO: 实现语音生成
          taskModel.update(task.id, {
            status: 'completed',
            progress: 100,
            result: { message: 'Speech generation not implemented yet' }
          });
          break;

        case 'merge':
          // TODO: 实现视频合并
          taskModel.update(task.id, {
            status: 'completed',
            progress: 100,
            result: { message: 'Video merge not implemented yet' }
          });
          break;

        default:
          taskModel.update(task.id, {
            status: 'failed',
            error: `Unknown task type: ${task.type}`
          });
      }
    } catch (error) {
      console.error(`Task ${task.id} failed:`, error);
      taskModel.update(task.id, {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

export const taskProcessor = new TaskProcessor();
