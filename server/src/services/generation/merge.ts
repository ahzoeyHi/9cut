import { storyboardModel } from '../../models/storyboard';
import { resourceModel } from '../../models/resource';
import { taskModel } from '../../models/task';
import { config } from '../../config';
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
import { v4 as uuidv4 } from 'uuid';

/**
 * 合并多个分镜视频
 */
export async function mergeVideos(
  projectId: string,
  taskId: string,
  storyboardIds?: string[]
): Promise<void> {
  try {
    taskModel.update(taskId, { status: 'processing', progress: 10 });

    // 获取分镜列表
    let storyboards = storyboardModel.findByProjectId(projectId);

    // 如果指定了分镜ID，则只处理指定的分镜
    if (storyboardIds && storyboardIds.length > 0) {
      storyboards = storyboards.filter(s => storyboardIds.includes(s.id));
    }

    // 按序号排序
    storyboards.sort((a, b) => a.sequence - b.sequence);

    taskModel.update(taskId, { progress: 20 });

    // 收集视频文件路径
    const generatedDir = config.getAbsolutePath(config.storage.generatedDir);
    const videoPaths: string[] = [];
    const missingVideos: number[] = [];

    for (const storyboard of storyboards) {
      if (storyboard.video_url) {
        const videoPath = path.join(generatedDir, storyboard.video_url);
        if (fs.existsSync(videoPath)) {
          videoPaths.push(videoPath);
        } else {
          missingVideos.push(storyboard.sequence + 1);
        }
      } else {
        missingVideos.push(storyboard.sequence + 1);
      }
    }

    if (missingVideos.length > 0) {
      throw new Error(`以下分镜缺少视频：${missingVideos.join(', ')}`);
    }

    if (videoPaths.length === 0) {
      throw new Error('没有可合并的视频');
    }

    taskModel.update(taskId, { progress: 30 });

    // 创建临时文件列表
    const tempListPath = path.join(generatedDir, `temp_${uuidv4()}.txt`);
    const fileListContent = videoPaths.map(p => `file '${p.replace(/'/g, "'\\''")}'`).join('\n');
    fs.writeFileSync(tempListPath, fileListContent);

    taskModel.update(taskId, { progress: 40 });

    // 输出文件
    const outputFilename = `merged_${uuidv4()}.mp4`;
    const videosDir = path.join(generatedDir, 'videos');
    if (!fs.existsSync(videosDir)) {
      fs.mkdirSync(videosDir, { recursive: true });
    }
    const outputPath = path.join(videosDir, outputFilename);

    // 使用FFmpeg合并视频
    await concatVideos(tempListPath, outputPath);

    // 清理临时文件
    fs.unlinkSync(tempListPath);

    taskModel.update(taskId, { progress: 80 });

    // 创建资源记录
    const stats = fs.statSync(outputPath);
    const resource = resourceModel.create({
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

    taskModel.update(taskId, { progress: 90 });

    // 完成任务
    taskModel.update(taskId, {
      status: 'completed',
      progress: 100,
      result: {
        resourceId: resource.id,
        videoPath: `videos/${outputFilename}`,
        storyboardCount: storyboards.length
      }
    });

  } catch (error) {
    console.error('Error merging videos:', error);

    taskModel.update(taskId, {
      status: 'failed',
      error: error instanceof Error ? error.message : '视频合并失败'
    });
  }
}

/**
 * 使用FFmpeg concat demuxer合并视频
 */
async function concatVideos(listPath: string, outputPath: string): Promise<void> {
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
export async function mergeVideoWithAudio(
  videoPath: string,
  audioPath: string,
  outputPath: string
): Promise<void> {
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
