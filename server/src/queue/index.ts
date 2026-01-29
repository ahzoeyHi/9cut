import { taskModel } from '../models/task';
import type { Task } from '../types';
import { generateStoryboards } from '../services/generation/storyboard';
import { generateImage } from '../services/generation/image';
import { generateVideo } from '../services/generation/video';
import { generateSpeech } from '../services/generation/speech';
import { generateNarration } from '../services/generation/narration';
import { mergeVideos } from '../services/generation/merge';

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
          } else {
            taskModel.update(task.id, {
              status: 'failed',
              error: 'Missing project_id for storyboard generation'
            });
          }
          break;

        case 'image':
          if (task.storyboard_id) {
            await generateImage(task.storyboard_id, task.id);
          } else {
            taskModel.update(task.id, {
              status: 'failed',
              error: 'Missing storyboard_id for image generation'
            });
          }
          break;

        case 'video':
          if (task.storyboard_id) {
            await generateVideo(task.storyboard_id, task.id);
          } else {
            taskModel.update(task.id, {
              status: 'failed',
              error: 'Missing storyboard_id for video generation'
            });
          }
          break;

        case 'narration':
          if (task.project_id) {
            await generateNarration(task.project_id, task.id);
          } else {
            taskModel.update(task.id, {
              status: 'failed',
              error: 'Missing project_id for narration generation'
            });
          }
          break;

        case 'speech':
          if (task.storyboard_id) {
            await generateSpeech(task.storyboard_id, task.id);
          } else {
            taskModel.update(task.id, {
              status: 'failed',
              error: 'Missing storyboard_id for speech generation'
            });
          }
          break;

        case 'merge':
          if (task.project_id) {
            await mergeVideos(task.project_id, task.id);
          } else {
            taskModel.update(task.id, {
              status: 'failed',
              error: 'Missing project_id for video merge'
            });
          }
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
