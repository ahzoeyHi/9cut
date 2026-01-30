"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeVideos = mergeVideos;
exports.mergeVideoWithAudio = mergeVideoWithAudio;
const storyboard_1 = require("../../models/storyboard");
const resource_1 = require("../../models/resource");
const task_1 = require("../../models/task");
const config_1 = require("../../config");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const child_process_1 = require("child_process");
const uuid_1 = require("uuid");
/**
 * 合并多个分镜视频
 */
async function mergeVideos(projectId, taskId, storyboardIds) {
    try {
        task_1.taskModel.update(taskId, { status: 'processing', progress: 10 });
        // 获取分镜列表
        let storyboards = storyboard_1.storyboardModel.findByProjectId(projectId);
        // 如果指定了分镜ID，则只处理指定的分镜
        if (storyboardIds && storyboardIds.length > 0) {
            storyboards = storyboards.filter(s => storyboardIds.includes(s.id));
        }
        // 按序号排序
        storyboards.sort((a, b) => a.sequence - b.sequence);
        task_1.taskModel.update(taskId, { progress: 20 });
        // 收集视频文件路径
        const generatedDir = config_1.config.getAbsolutePath(config_1.config.storage.generatedDir);
        const videoPaths = [];
        const missingVideos = [];
        for (const storyboard of storyboards) {
            if (storyboard.video_url) {
                const videoPath = path_1.default.join(generatedDir, storyboard.video_url);
                if (fs_1.default.existsSync(videoPath)) {
                    videoPaths.push(videoPath);
                }
                else {
                    missingVideos.push(storyboard.sequence + 1);
                }
            }
            else {
                missingVideos.push(storyboard.sequence + 1);
            }
        }
        if (missingVideos.length > 0) {
            throw new Error(`以下分镜缺少视频：${missingVideos.join(', ')}`);
        }
        if (videoPaths.length === 0) {
            throw new Error('没有可合并的视频');
        }
        task_1.taskModel.update(taskId, { progress: 30 });
        // 创建临时文件列表
        const tempListPath = path_1.default.join(generatedDir, `temp_${(0, uuid_1.v4)()}.txt`);
        const fileListContent = videoPaths.map(p => `file '${p.replace(/'/g, "'\\''")}'`).join('\n');
        fs_1.default.writeFileSync(tempListPath, fileListContent);
        task_1.taskModel.update(taskId, { progress: 40 });
        // 输出文件
        const outputFilename = `merged_${(0, uuid_1.v4)()}.mp4`;
        const videosDir = path_1.default.join(generatedDir, 'videos');
        if (!fs_1.default.existsSync(videosDir)) {
            fs_1.default.mkdirSync(videosDir, { recursive: true });
        }
        const outputPath = path_1.default.join(videosDir, outputFilename);
        // 使用FFmpeg合并视频
        await concatVideos(tempListPath, outputPath);
        // 清理临时文件
        fs_1.default.unlinkSync(tempListPath);
        task_1.taskModel.update(taskId, { progress: 80 });
        // 创建资源记录
        const stats = fs_1.default.statSync(outputPath);
        const resource = resource_1.resourceModel.create({
            type: 'video',
            subtype: 'merged',
            file_path: `videos/${outputFilename}`,
            file_size: stats.size,
            mime_type: 'video/mp4',
            project_id: projectId,
            metadata: {
                storyboardCount: storyboards.length,
                storyboardIds: storyboards.map(s => s.id),
                generatedAt: new Date().toISOString()
            }
        });
        task_1.taskModel.update(taskId, { progress: 90 });
        // 完成任务
        task_1.taskModel.update(taskId, {
            status: 'completed',
            progress: 100,
            result: {
                resourceId: resource.id,
                videoPath: `videos/${outputFilename}`,
                storyboardCount: storyboards.length
            }
        });
    }
    catch (error) {
        console.error('Error merging videos:', error);
        task_1.taskModel.update(taskId, {
            status: 'failed',
            error: error instanceof Error ? error.message : '视频合并失败'
        });
    }
}
/**
 * 使用FFmpeg concat demuxer合并视频
 */
async function concatVideos(listPath, outputPath) {
    return new Promise((resolve, reject) => {
        const ffmpegPath = process.env.FFMPEG_PATH || 'ffmpeg';
        const args = [
            '-f', 'concat',
            '-safe', '0',
            '-i', listPath,
            '-c', 'copy',
            '-y',
            outputPath
        ];
        console.log('FFmpeg concat command:', ffmpegPath, args.join(' '));
        const ffmpeg = (0, child_process_1.spawn)(ffmpegPath, args);
        let stderr = '';
        ffmpeg.stderr.on('data', (data) => {
            stderr += data.toString();
        });
        ffmpeg.on('close', (code) => {
            if (code === 0) {
                resolve();
            }
            else {
                console.error('FFmpeg stderr:', stderr);
                reject(new Error(`FFmpeg concat exited with code ${code}`));
            }
        });
        ffmpeg.on('error', (err) => {
            reject(new Error(`FFmpeg error: ${err.message}`));
        });
    });
}
/**
 * 合并视频并添加音频轨道
 */
async function mergeVideoWithAudio(videoPath, audioPath, outputPath) {
    return new Promise((resolve, reject) => {
        const ffmpegPath = process.env.FFMPEG_PATH || 'ffmpeg';
        const args = [
            '-i', videoPath,
            '-i', audioPath,
            '-c:v', 'copy',
            '-c:a', 'aac',
            '-shortest',
            '-y',
            outputPath
        ];
        const ffmpeg = (0, child_process_1.spawn)(ffmpegPath, args);
        ffmpeg.on('close', (code) => {
            if (code === 0) {
                resolve();
            }
            else {
                reject(new Error(`FFmpeg exited with code ${code}`));
            }
        });
        ffmpeg.on('error', (err) => {
            reject(new Error(`FFmpeg error: ${err.message}`));
        });
    });
}
//# sourceMappingURL=merge.js.map