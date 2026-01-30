"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateVideo = generateVideo;
exports.generateSimpleVideo = generateSimpleVideo;
const storyboard_1 = require("../../models/storyboard");
const resource_1 = require("../../models/resource");
const task_1 = require("../../models/task");
const config_1 = require("../../config");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const child_process_1 = require("child_process");
const uuid_1 = require("uuid");
/**
 * 使用FFmpeg生成从首帧到尾帧的过渡视频
 * 支持：淡入淡出、缩放、平移等效果
 */
async function generateVideo(storyboardId, taskId) {
    try {
        task_1.taskModel.update(taskId, { status: 'processing', progress: 10 });
        // 获取分镜信息
        const storyboard = storyboard_1.storyboardModel.findById(storyboardId);
        if (!storyboard) {
            throw new Error('分镜不存在');
        }
        task_1.taskModel.update(taskId, { progress: 20 });
        // 验证首帧和尾帧是否存在
        if (!storyboard.first_frame_url || !storyboard.last_frame_url) {
            throw new Error('请先生成首帧和尾帧图片');
        }
        const generatedDir = config_1.config.getAbsolutePath(config_1.config.storage.generatedDir);
        const firstFramePath = path_1.default.join(generatedDir, storyboard.first_frame_url);
        const lastFramePath = path_1.default.join(generatedDir, storyboard.last_frame_url);
        // 检查文件是否存在
        if (!fs_1.default.existsSync(firstFramePath) || !fs_1.default.existsSync(lastFramePath)) {
            throw new Error('首帧或尾帧图片文件不存在');
        }
        task_1.taskModel.update(taskId, { progress: 30 });
        // 更新分镜状态
        storyboard_1.storyboardModel.update(storyboardId, { status: 'generating' });
        // 生成视频
        const videoDuration = storyboard.duration / 1000; // 转换为秒
        const outputFilename = `${(0, uuid_1.v4)()}.mp4`;
        const videosDir = path_1.default.join(generatedDir, 'videos');
        // 确保目录存在
        if (!fs_1.default.existsSync(videosDir)) {
            fs_1.default.mkdirSync(videosDir, { recursive: true });
        }
        const outputPath = path_1.default.join(videosDir, outputFilename);
        task_1.taskModel.update(taskId, { progress: 40 });
        // 使用FFmpeg生成过渡视频
        await generateTransitionVideo(firstFramePath, lastFramePath, outputPath, videoDuration);
        task_1.taskModel.update(taskId, { progress: 80 });
        // 创建资源记录
        const stats = fs_1.default.statSync(outputPath);
        const resource = resource_1.resourceModel.create({
            type: 'video',
            file_path: `videos/${outputFilename}`,
            file_size: stats.size,
            mime_type: 'video/mp4',
            storyboard_id: storyboardId,
            project_id: storyboard.project_id,
            metadata: {
                duration: videoDuration,
                generatedAt: new Date().toISOString()
            }
        });
        // 关联资源到分镜
        resource_1.resourceModel.linkToStoryboard(storyboardId, resource.id, 'video');
        task_1.taskModel.update(taskId, { progress: 90 });
        // 更新分镜状态
        storyboard_1.storyboardModel.update(storyboardId, { status: 'completed' });
        // 完成任务
        task_1.taskModel.update(taskId, {
            status: 'completed',
            progress: 100,
            result: {
                resourceId: resource.id,
                videoPath: `videos/${outputFilename}`,
                duration: videoDuration
            }
        });
    }
    catch (error) {
        console.error('Error generating video:', error);
        storyboard_1.storyboardModel.update(storyboardId, { status: 'error' });
        task_1.taskModel.update(taskId, {
            status: 'failed',
            error: error instanceof Error ? error.message : '视频生成失败'
        });
    }
}
/**
 * 使用FFmpeg生成过渡视频
 * 效果：从首帧到尾帧的渐变过渡 + 轻微缩放效果
 */
async function generateTransitionVideo(firstFramePath, lastFramePath, outputPath, duration) {
    return new Promise((resolve, reject) => {
        const ffmpegPath = process.env.FFMPEG_PATH || 'ffmpeg';
        // FFmpeg 参数：
        // 1. 输入两张图片
        // 2. 使用xfade滤镜实现交叉淡变
        // 3. 添加轻微缩放动画效果
        const args = [
            '-loop', '1',
            '-t', String(duration / 2),
            '-i', firstFramePath,
            '-loop', '1',
            '-t', String(duration / 2),
            '-i', lastFramePath,
            '-filter_complex', `
        [0:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30,zoompan=z='min(zoom+0.0005,1.05)':d=${duration * 30 / 2}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1920x1080[v0];
        [1:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30,zoompan=z='min(zoom+0.0005,1.05)':d=${duration * 30 / 2}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1920x1080[v1];
        [v0][v1]xfade=transition=fade:duration=0.5:offset=${duration / 2 - 0.5}[outv]
      `.replace(/\s+/g, ''),
            '-map', '[outv]',
            '-c:v', 'libx264',
            '-preset', 'fast',
            '-crf', '23',
            '-pix_fmt', 'yuv420p',
            '-t', String(duration),
            '-y',
            outputPath
        ];
        console.log('FFmpeg command:', ffmpegPath, args.join(' '));
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
                reject(new Error(`FFmpeg exited with code ${code}: ${stderr.slice(-500)}`));
            }
        });
        ffmpeg.on('error', (err) => {
            reject(new Error(`FFmpeg error: ${err.message}`));
        });
    });
}
/**
 * 生成简单的单图视频（用于首帧和尾帧相同的情况）
 */
async function generateSimpleVideo(imagePath, outputPath, duration) {
    return new Promise((resolve, reject) => {
        const ffmpegPath = process.env.FFMPEG_PATH || 'ffmpeg';
        const args = [
            '-loop', '1',
            '-i', imagePath,
            '-c:v', 'libx264',
            '-t', String(duration),
            '-pix_fmt', 'yuv420p',
            '-vf', 'scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2',
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
//# sourceMappingURL=video.js.map