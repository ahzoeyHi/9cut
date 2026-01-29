import { storyboardModel } from '../../models/storyboard';
import { resourceModel } from '../../models/resource';
import { taskModel } from '../../models/task';
import { config } from '../../config';
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
import { v4 as uuidv4 } from 'uuid';

/**
 * 使用FFmpeg生成从首帧到尾帧的过渡视频
 * 支持：淡入淡出、缩放、平移等效果
 */
export async function generateVideo(
  storyboardId: string,
  taskId: string
): Promise<void> {
  try {
    taskModel.update(taskId, { status: 'processing', progress: 10 });

    // 获取分镜信息
    const storyboard = storyboardModel.findById(storyboardId);
    if (!storyboard) {
      throw new Error('分镜不存在');
    }

    taskModel.update(taskId, { progress: 20 });

    // 验证首帧和尾帧是否存在
    if (!storyboard.first_frame_url || !storyboard.last_frame_url) {
      throw new Error('请先生成首帧和尾帧图片');
    }

    const generatedDir = config.getAbsolutePath(config.storage.generatedDir);
    const firstFramePath = path.join(generatedDir, storyboard.first_frame_url);
    const lastFramePath = path.join(generatedDir, storyboard.last_frame_url);

    // 检查文件是否存在
    if (!fs.existsSync(firstFramePath) || !fs.existsSync(lastFramePath)) {
      throw new Error('首帧或尾帧图片文件不存在');
    }

    taskModel.update(taskId, { progress: 30 });

    // 更新分镜状态
    storyboardModel.update(storyboardId, { status: 'generating' });

    // 生成视频
    const videoDuration = storyboard.duration / 1000; // 转换为秒
    const outputFilename = `${uuidv4()}.mp4`;
    const videosDir = path.join(generatedDir, 'videos');

    // 确保目录存在
    if (!fs.existsSync(videosDir)) {
      fs.mkdirSync(videosDir, { recursive: true });
    }

    const outputPath = path.join(videosDir, outputFilename);

    taskModel.update(taskId, { progress: 40 });

    // 使用FFmpeg生成过渡视频
    await generateTransitionVideo(firstFramePath, lastFramePath, outputPath, videoDuration);

    taskModel.update(taskId, { progress: 80 });

    // 创建资源记录
    const stats = fs.statSync(outputPath);
    const resource = resourceModel.create({
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
    resourceModel.linkToStoryboard(storyboardId, resource.id, 'video');

    taskModel.update(taskId, { progress: 90 });

    // 更新分镜状态
    storyboardModel.update(storyboardId, { status: 'completed' });

    // 完成任务
    taskModel.update(taskId, {
      status: 'completed',
      progress: 100,
      result: {
        resourceId: resource.id,
        videoPath: `videos/${outputFilename}`,
        duration: videoDuration
      }
    });

  } catch (error) {
    console.error('Error generating video:', error);

    storyboardModel.update(storyboardId, { status: 'error' });

    taskModel.update(taskId, {
      status: 'failed',
      error: error instanceof Error ? error.message : '视频生成失败'
    });
  }
}

/**
 * 使用FFmpeg生成过渡视频
 * 效果：从首帧到尾帧的渐变过渡 + 轻微缩放效果
 */
async function generateTransitionVideo(
  firstFramePath: string,
  lastFramePath: string,
  outputPath: string,
  duration: number
): Promise<void> {
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

    const ffmpeg = spawn(ffmpegPath, args);

    let stderr = '';
    ffmpeg.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    ffmpeg.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
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
export async function generateSimpleVideo(
  imagePath: string,
  outputPath: string,
  duration: number
): Promise<void> {
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

    const ffmpeg = spawn(ffmpegPath, args);

    ffmpeg.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`FFmpeg exited with code ${code}`));
      }
    });

    ffmpeg.on('error', (err) => {
      reject(new Error(`FFmpeg error: ${err.message}`));
    });
  });
}
