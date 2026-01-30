"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.taskProcessor = void 0;
const task_1 = require("../models/task");
const storyboard_1 = require("../services/generation/storyboard");
const image_1 = require("../services/generation/image");
const video_1 = require("../services/generation/video");
const speech_1 = require("../services/generation/speech");
const narration_1 = require("../services/generation/narration");
const merge_1 = require("../services/generation/merge");
// 简单的任务处理器
class TaskProcessor {
    isRunning = false;
    intervalId = null;
    start() {
        if (this.isRunning)
            return;
        this.isRunning = true;
        this.intervalId = setInterval(() => this.processNextTask(), 2000);
        console.log('Task processor started');
    }
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.isRunning = false;
        console.log('Task processor stopped');
    }
    async processNextTask() {
        // 检查是否有正在处理的任务
        const processingTasks = task_1.taskModel.findProcessing();
        if (processingTasks.length > 0) {
            return; // 等待当前任务完成
        }
        // 获取下一个待处理的任务
        const pendingTasks = task_1.taskModel.findPending();
        if (pendingTasks.length === 0) {
            return;
        }
        const task = pendingTasks[0];
        await this.processTask(task);
    }
    async processTask(task) {
        console.log(`Processing task: ${task.id} (${task.type})`);
        try {
            switch (task.type) {
                case 'storyboard':
                    if (task.project_id) {
                        await (0, storyboard_1.generateStoryboards)(task.project_id, task.id);
                    }
                    else {
                        task_1.taskModel.update(task.id, {
                            status: 'failed',
                            error: 'Missing project_id for storyboard generation'
                        });
                    }
                    break;
                case 'image':
                    if (task.storyboard_id) {
                        await (0, image_1.generateImage)(task.storyboard_id, task.id);
                    }
                    else {
                        task_1.taskModel.update(task.id, {
                            status: 'failed',
                            error: 'Missing storyboard_id for image generation'
                        });
                    }
                    break;
                case 'video':
                    if (task.storyboard_id) {
                        await (0, video_1.generateVideo)(task.storyboard_id, task.id);
                    }
                    else {
                        task_1.taskModel.update(task.id, {
                            status: 'failed',
                            error: 'Missing storyboard_id for video generation'
                        });
                    }
                    break;
                case 'narration':
                    if (task.project_id) {
                        await (0, narration_1.generateNarration)(task.project_id, task.id);
                    }
                    else {
                        task_1.taskModel.update(task.id, {
                            status: 'failed',
                            error: 'Missing project_id for narration generation'
                        });
                    }
                    break;
                case 'speech':
                    if (task.storyboard_id) {
                        await (0, speech_1.generateSpeech)(task.storyboard_id, task.id);
                    }
                    else {
                        task_1.taskModel.update(task.id, {
                            status: 'failed',
                            error: 'Missing storyboard_id for speech generation'
                        });
                    }
                    break;
                case 'merge':
                    if (task.project_id) {
                        await (0, merge_1.mergeVideos)(task.project_id, task.id);
                    }
                    else {
                        task_1.taskModel.update(task.id, {
                            status: 'failed',
                            error: 'Missing project_id for video merge'
                        });
                    }
                    break;
                default:
                    task_1.taskModel.update(task.id, {
                        status: 'failed',
                        error: `Unknown task type: ${task.type}`
                    });
            }
        }
        catch (error) {
            console.error(`Task ${task.id} failed:`, error);
            task_1.taskModel.update(task.id, {
                status: 'failed',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
}
exports.taskProcessor = new TaskProcessor();
//# sourceMappingURL=index.js.map